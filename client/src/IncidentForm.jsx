import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  Stack,
  Typography,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthProvider";
import axios from "axios";


const PRIORITY_MATRIX = {
  "high-high": 1,      // Critical
  "high-medium": 2,    // High
  "high-low": 2,       // High
  "medium-high": 2,    // High
  "medium-medium": 3,  // Medium
  "medium-low": 3,     // Medium
  "low-high": 3,       // Medium
  "low-medium": 4,     // Low
  "low-low": 4,        // Low
};

const PRIORITY_LABELS = {
  1: "Critical",
  2: "High",
  3: "Medium",
  4: "Low",
};

export default function IncidentForm({ incident = null, onClose = null, onSubmitSuccess = null }) {
  const { isLogged } = useContext(AuthContext);
  const isEditMode = !!incident;
  const [formData, setFormData] = useState({
    short_description: "",
    description: "",
    urgency: "medium",
    impact: "medium",
    priority: 3,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // Initialize form with incident data if in edit mode
  useEffect(() => {
    if (isEditMode && incident) {
      const urgency = incident.urgency?.toLowerCase() || "medium";
      const impact = incident.impact?.toLowerCase() || "medium";
      const priority = parseInt(incident.priority) || 3;
      
      setFormData({
        short_description: incident.short_description || "",
        description: incident.description || "",
        urgency: urgency,
        impact: impact,
        priority: priority,
      });
    }
  }, [incident, isEditMode]);

  
  useEffect(() => {
    const key = `${formData.urgency}-${formData.impact}`;
    const calculatedPriority = PRIORITY_MATRIX[key] || 3;
    setFormData((prev) => ({
      ...prev,
      priority: calculatedPriority,
    }));
  }, [formData.urgency, formData.impact]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const incidentPayload = {
        short_description: formData.short_description,
        description: formData.description,
        urgency: formData.urgency,
        impact: formData.impact,
        priority: formData.priority.toString(),
      };

      let response;
      if (isEditMode) {
       
        response = await axios.patch(
          `http://localhost:3001/api/incidents/${incident.sys_id}`,
          incidentPayload,
          { withCredentials: true }
        );
      } else {
        // Create new incident
        response = await axios.post(
          "http://localhost:3001/api/incidents",
          incidentPayload,
          { withCredentials: true }
        );
      }

      setMessageType("success");
      setMessage(
        isEditMode
          ? "Incident updated successfully!"
          : "Incident created successfully! ID: " + response.data.sys_id
      );

      
      if (!isEditMode) {
        setFormData({
          short_description: "",
          description: "",
          urgency: "medium",
          impact: "medium",
          priority: 3,
        });
      }

     
      if (onSubmitSuccess) {
        setTimeout(() => {
          onSubmitSuccess();
        }, 1000);
      }

      
      if (isEditMode && onClose) {
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.response?.data?.message || "Failed to save incident. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isLogged) {
    return <Typography>Please log in to manage incidents.</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 3 }}>
            {isEditMode ? "Edit Incident" : "Create New Incident"}
          </Typography>

          {message && (
            <Alert severity={messageType} sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Short Description */}
              <TextField
                fullWidth
                label="Short Description"
                name="short_description"
                value={formData.short_description}
                onChange={handleInputChange}
                required
                variant="outlined"
              />

              {/* Full Description */}
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                variant="outlined"
              />

              {/* Urgency Selection */}
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Urgency</FormLabel>
                <Select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>

              {/* Impact Selection */}
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Impact</FormLabel>
                <Select
                  name="impact"
                  value={formData.impact}
                  onChange={handleInputChange}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>

              
              <Box
                sx={{
                  p: 2,
                  bgcolor: "background.default",
                  borderRadius: 1,
                  border: "1px solid divider",
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                  Auto-Calculated Priority
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="h6">
                    Priority: {PRIORITY_LABELS[formData.priority]} ({formData.priority})
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Based on Urgency: {formData.urgency.toUpperCase()} | Impact:{" "}
                    {formData.impact.toUpperCase()}
                  </Typography>
                </Stack>
              </Box>

              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading || !formData.short_description}
                sx={{ mt: 2 }}
              >
                {loading
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                  ? "Update Incident"
                  : "Create Incident"}
              </Button>

              {isEditMode && onClose && (
                <Button
                  onClick={onClose}
                  variant="outlined"
                  color="secondary"
                  size="large"
                  sx={{ mt: 1 }}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
