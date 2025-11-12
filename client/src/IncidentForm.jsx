import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";

export default function IncidentForm({ incident, onCancel, onSave }) {
  const [form, setForm] = useState({
    sys_id: "",
    number: "",
    short_description: "",
    state: "",
    priority: "",
  });

  useEffect(() => {
    if (incident) {
      setForm({
        sys_id: incident.sys_id,
        number: incident.number || "",
        short_description: incident.short_description || "",
        state: incident.state || "",
        priority: incident.priority || "",
      });
    } else {
      setForm({ sys_id: "", number: "", short_description: "", state: "", priority: "" });
    }
  }, [incident]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.sys_id) return;
    // send only allowed fields
    const payload = {
      short_description: form.short_description,
      state: form.state,
      priority: form.priority,
    };
    onSave && onSave(form.sys_id, payload);
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
      <Typography variant="h6">Edit Incident</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            label="Incident #"
            name="number"
            value={form.number}
            InputProps={{ readOnly: true }}
            sx={{ minWidth: 220 }}
          />

          <TextField
            label="Priority"
            name="priority"
            select
            value={form.priority}
            onChange={handleChange}
            sx={{ width: 140 }}
          >
            <MenuItem value="1">1</MenuItem>
            <MenuItem value="2">2</MenuItem>
            <MenuItem value="3">3</MenuItem>
            <MenuItem value="4">4</MenuItem>
            <MenuItem value="5">5</MenuItem>
          </TextField>

          <TextField
            label="State"
            name="state"
            select
            value={form.state}
            onChange={handleChange}
            sx={{ width: 180 }}
          >
            <MenuItem value="1">New</MenuItem>
            <MenuItem value="2">In Progress</MenuItem>
            <MenuItem value="3">On Hold</MenuItem>
            <MenuItem value="6">Resolved</MenuItem>
            <MenuItem value="7">Closed</MenuItem>
          </TextField>
        </Stack>

        <TextField
          label="Short description"
          name="short_description"
          value={form.short_description}
          onChange={handleChange}
          fullWidth
          multiline
          rows={2}
          sx={{ mt: 2 }}
        />

        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
          <Button variant="outlined" onClick={onCancel} color="inherit">
            Cancel
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
