import {
  Stack,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthProvider";
import axios from "axios";
import IncidentForm from "./IncidentForm";

export default function Home() {
  const { isLogged } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch incidents from server
  const fetchIncidents = async () => {
    if (isLogged) {
      try {
        const incidentList = await axios.get(
          "http://localhost:3001/api/incidents",
          { withCredentials: true }
        );
        setIncidents(incidentList.data.result);
      } catch (error) {
        console.error("Error fetching incidents:", error);
      }
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [isLogged]);

  // Handle Edit Button Click
  const handleEditClick = (incident) => {
    setSelectedIncident(incident);
    setOpenEditForm(true);
  };

  // Handle Delete Button Click
  const handleDeleteClick = (incident) => {
    setSelectedIncident(incident);
    setOpenDeleteDialog(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedIncident) return;

    setLoading(true);
    try {
      await axios.delete(
        `http://localhost:3001/api/incidents/${selectedIncident.sys_id}`,
        { withCredentials: true }
      );

      // Remove deleted incident from the list
      setIncidents((prev) =>
        prev.filter((inc) => inc.sys_id !== selectedIncident.sys_id)
      );

      setOpenDeleteDialog(false);
      setSelectedIncident(null);
    } catch (error) {
      console.error("Error deleting incident:", error);
      alert("Failed to delete incident. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form close
  const handleCloseEditForm = () => {
    setOpenEditForm(false);
    setSelectedIncident(null);
  };

  // Handle form submission success
  const handleFormSuccess = () => {
    fetchIncidents();
    handleCloseEditForm();
  };

  return (
    <>
      {isLogged && incidents ? (
        <>
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5">Incident Records:</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenCreateForm(true)}
              >
                + Create New Incident
              </Button>
            </Stack>

            <Grid container spacing={5} justifyContent={"space-around"}>
              {incidents.map((inc) => {
                return (
                  <Grid key={inc.sys_id}>
                    <Card sx={{ width: 300, height: 250 }}>
                      <CardContent>
                        <Typography variant="h6">
                          Incident #: {inc.number}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Description:</strong> {inc.short_description}
                        </Typography>
                        <Typography variant="body2">
                          <strong>State:</strong> {inc.state}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Priority:</strong> {inc.priority}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleEditClick(inc)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={() => handleDeleteClick(inc)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Stack>

          {/* Create Incident Form Dialog */}
          <Dialog
            open={openCreateForm}
            onClose={() => setOpenCreateForm(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogContent>
              <IncidentForm
                onClose={() => setOpenCreateForm(false)}
                onSubmitSuccess={() => {
                  fetchIncidents();
                  setOpenCreateForm(false);
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Incident Form Dialog */}
          <Dialog
            open={openEditForm}
            onClose={handleCloseEditForm}
            fullWidth
            maxWidth="sm"
          >
            <DialogContent>
              <IncidentForm
                incident={selectedIncident}
                onClose={handleCloseEditForm}
                onSubmitSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
            <DialogTitle>Delete Incident</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete incident #{selectedIncident?.number}?
                This action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setOpenDeleteDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                color="error"
                variant="contained"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <Typography>Please log in</Typography>
      )}
    </>
  );
}
