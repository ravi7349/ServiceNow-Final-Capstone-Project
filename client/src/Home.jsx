import {
  Stack,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthProvider";
import axios from "axios";
import IncidentForm from "./IncidentForm";

export default function Home() {
  const { isLogged } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [editing, setEditing] = useState(null);

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
    } catch (e) {
      console.error('Delete failed', e);
      alert('Delete failed: ' + (e.response?.data || e.message));
    }
  };

  return (
    <>
      {isLogged && incidents ? (
        <>
          {/* show form when editing */}
          {editing && (
            <IncidentForm incident={editing} onCancel={handleCancel} onSave={handleSave} />
          )}

          <Stack spacing={3}>
            <Typography variant="h5">Incident Records:</Typography>

            <Grid container spacing={5} justifyContent={"space-around"}>
              {incidents.map((inc, index) => {
                return (
                  <Grid key={inc.sys_id}>
                    <Card sx={{ width: 300, height: 200 }}>
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
    </>
  );
}
