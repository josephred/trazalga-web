import axios from 'axios';

async function testLogin() {
    const url = 'https://apps.procesac.com/api/auth/login';

    // El código actual envía el RUT sin dígito verificador y sin puntos/guion
    // Ejemplo: si el usuario pone 12.345.678-9, envía 12345678
    const testData = {
        rut: '12345678', // Reemplaza con un RUT de prueba real (solo números, sin DV)
        clave: 'tu_clave' // Reemplaza con una clave de prueba real
    };

    console.log('Probando Login en:', url);
    console.log('Cuerpo enviado:', testData);

    try {
        const response = await axios.post(url, testData, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://apps.procesac.com',
                'Referer': 'https://apps.procesac.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            }
        });

        console.log('Status:', response.status);
        console.log('Data:', response.data);
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', error.response?.data);
        if (!error.response) {
            console.error('Error Message:', error.message);
        }
    }
}

testLogin();
