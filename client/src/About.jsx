import { Box, Typography, Divider, List, ListItem, ListItemText, Chip, Stack } from "@mui/material";

export default function About() {
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
                About this Project
            </Typography>

            <Typography variant="h6" sx={{ mt: 2 }}>
                Project description
            </Typography>
            <Typography variant="body1" paragraph>
                Incident Management is a small demo application built to showcase a
                front-end client (React + Vite + MUI) talking to a backend BFF (Node/Express)
                which in turn integrates with a ServiceNow instance via its REST API.
                The app lets users authenticate with ServiceNow, list incidents,
                create, update, and delete them from the UI while the BFF handles
                access tokens and API calls to the ServiceNow platform.
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mt: 2 }}>
                About this page
            </Typography>
            <Typography variant="body1" paragraph>
                The About page explains what the project does and which tools and
                technologies are used. Use the navigation bar's About link to return
                to this page at any time.
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mt: 2 }}>
                Tools & Technologies
            </Typography>
            <List>
                <ListItem>
                    <ListItemText primary="Frontend" secondary="React (v18+), Vite, Material UI (MUI), Axios" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="Backend (BFF)" secondary="Node.js, Express, axios, cookie-parser, dotenv" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="Auth" secondary="OAuth 2.0 PKCE flow handled by the BFF" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="Storage / Dev" secondary="LocalStorage for theme preference; in-memory store for sessions (demo only)" />
                </ListItem>
            </List>

            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label="React" />
                <Chip label="Vite" />
                <Chip label="MUI" />
                <Chip label="Node.js" />
                <Chip label="Express" />
                <Chip label="ServiceNow API" />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mt: 2 }}>
                ServiceNow integration
            </Typography>
            <Typography variant="body1" paragraph>
                This demo uses the ServiceNow REST API to read and modify incidents
                (table: incident). The BFF performs the OAuth PKCE authorization code
                flow and stores access/refresh tokens in a temporary in-memory store.
                When the client asks for incident operations, the BFF forwards the
                requests to the ServiceNow instance using the stored access token.
                The BFF also attempts to refresh the token automatically when it
                receives a 401 from ServiceNow.
            </Typography>

            <Typography variant="body2" color="text.secondary">
                Notes: This application is a learning/demo project. The in-memory
                tokenStore is not production safe. For production use you should
                persist sessions and tokens in a secure store (Redis or database),
                enforce proper error handling and input validation, and secure
                secrets with environment management.
            </Typography>
        </Box>
    );
}