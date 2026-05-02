async function test() {
  try {
    // 1. Login as admin
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@empay.dev',
        password: 'Admin@123'
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(JSON.stringify(loginData));
    
    const token = loginData.token;
    console.log('Logged in successfully. Token length:', token.length);

    // 2. Try to create an employee
    const createRes = await fetch('http://localhost:5000/api/employees', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        email: 'test_create_xyz@empay.dev',
        firstName: 'Test',
        lastName: 'Create',
        department: 'Engineering',
        designation: 'Tester',
        employeeCode: 'TEST999',
        joiningDate: new Date().toISOString(),
        ctcAnnual: 500000
      })
    });

    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(JSON.stringify(createData));

    console.log('Create success:', createData);
  } catch (err) {
    console.error('Error occurred:', err.message);
  }
}

test();
