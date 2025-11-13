import {
  Stack,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthProvider";
import axios from "axios";
import IncidentForm from "./IncidentForm";

export default function Home() {
  const { isLogged } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [editing, setEditing] = useState(null);
  const theme = useTheme();
  const cardBg = theme.palette.mode === "dark" ? alpha(theme.palette.primary.main, 0.06) : "#f5f7fb";
  const [creating, setCreating] = useState(false);
  const [notif, setNotif] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    async function fetchData() {
      if (isLogged) {
        const incidentList = await axios.get(
          "http://localhost:3001/api/incidents",
          { withCredentials: true }
        );
        setIncidents(incidentList.data.result || []);
      }
    }

    fetchData();
  }, [isLogged]);

  const handleEdit = (inc) => {
    setEditing(inc);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => setEditing(null);

  const handleCreateClick = () => {
    setCreating(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreate = async (payload) => {
    try {
      const resp = await axios.post(`http://localhost:3001/api/incidents`, payload, {
        withCredentials: true,
      });

      // ServiceNow returns created record in resp.data.result or resp.data;
      const newRec = resp.data.result || resp.data;
      // If SN returns the record inside result, push that; otherwise merge payload
      const toAdd = newRec && newRec.sys_id ? newRec : { ...payload, number: newRec?.number || "(new)", sys_id: newRec?.sys_id || Date.now().toString() };
      setIncidents((prev) => [toAdd, ...prev]);
      setCreating(false);
      setNotif({ open: true, message: "Incident created successfully", severity: "success" });
    } catch (e) {
      console.error('Create failed', e);
      alert('Create failed: ' + (e.response?.data || e.message));
    }
  };

  const handleSave = async (sys_id, payload) => {
    try {
      const resp = await axios.put(
        `http://localhost:3001/api/incidents/${sys_id}`,
        payload,
        { withCredentials: true }
      );

      // resp.data.result or resp.data may vary depending on ServiceNow response
      // We'll optimistically update the incidents in UI
      setIncidents((prev) =>
        prev.map((it) => (it.sys_id === sys_id ? { ...it, ...payload } : it))
      );
      setEditing(null);
      setNotif({ open: true, message: "Incident updated successfully", severity: "success" });
    } catch (e) {
      console.error("Update failed", e);
      alert("Update failed: " + (e.response?.data || e.message));
    }
  };

  const handleDelete = async (sys_id) => {
    if (!confirm('Delete this incident? This cannot be undone.')) return;
    try {
      await axios.delete(`http://localhost:3001/api/incidents/${sys_id}`, {
        withCredentials: true,
      });

      // remove from UI
      setIncidents((prev) => prev.filter((it) => it.sys_id !== sys_id));
      setNotif({ open: true, message: "Incident deleted", severity: "success" });
    } catch (e) {
      console.error('Delete failed', e);
      alert('Delete failed: ' + (e.response?.data || e.message));
    }
  };

  return (
    <>
      {isLogged && incidents ? (
        <>
          {/* show form when editing or creating */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Incident Records:</Typography>
            <Button variant="contained" color="primary" onClick={handleCreateClick}>
              Create Incident
            </Button>
          </Stack>

          {creating && (
            <IncidentForm
              incident={null}
              onCancel={() => setCreating(false)}
              onCreate={handleCreate}
            />
          )}

          <Stack spacing={3}>
            <Grid container spacing={5} justifyContent={"space-around"}>
              {incidents.map((inc, index) => {
                return (
                  <Grid key={inc.sys_id}>
                    <Card sx={{ width: 300, height: 200, bgcolor: cardBg, borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="h6">
                          Incident #: {inc.number}
                        </Typography>
                        <Typography variant="body2">
                          Description: {inc.short_description}
                        </Typography>
                        <Typography variant="body2">
                          State: {inc.state}
                        </Typography>
                        <Typography variant="body2">
                          Priority: {inc.priority}
                        </Typography>
                        <Button
                          sx={{ mt: 1 }}
                          variant="contained"
                          color="success"
                          onClick={() => handleEdit(inc)}
                        >
                          Edit
                        </Button>
                        <Button
                          sx={{ mt: 1, mx: 1 }}
                          variant="contained"
                          color="error"
                          onClick={() => handleDelete(inc.sys_id)}
                        >
                          Delete
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Stack>
        </>
      ) : (
        <Typography>Please log in</Typography>
      )}
      <Snackbar
        open={notif.open}
        autoHideDuration={4000}
        onClose={() => setNotif((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setNotif((s) => ({ ...s, open: false }))}
          severity={notif.severity}
          sx={{ width: "100%" }}
        >
          {notif.message}
        </Alert>
      </Snackbar>
    </>
  );
}
