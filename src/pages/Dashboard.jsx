import { Typography, Container } from '@mui/material';

export default function Dashboard() {
  return (
    <Container>
      <Typography variant="h3" sx={{ mt: 4 }}>
        Bienvenido al Panel de Gestión Trazalga
      </Typography>
      <Typography variant="body1">
        Aquí irán los gráficos y tablas.
      </Typography>
    </Container>
  );
}