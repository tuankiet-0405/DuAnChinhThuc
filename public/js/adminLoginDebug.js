// Check Admin Login and Debug Contact API issues
function checkAdminLogin() {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    
    console.group('🔍 Admin Authentication Check');
    console.log('Admin token exists:', !!adminToken);
    console.log('Admin user info exists:', !!adminUser);
    
    if (adminToken) {
        try {
            // Display first part of token for debugging (not showing full token for security)
            console.log('Token preview:', adminToken.substring(0, 20) + '...');
            
            // Check if token is a valid JWT format
            const parts = adminToken.split('.');
            if (parts.length === 3) {
                try {
                    const payload = JSON.parse(atob(parts[1]));
                    console.log('Token payload:', payload);
                    console.log('Admin role in token:', payload.loai_tai_khoan);
                    
                    // Check if token is still valid
                    const expiry = new Date(payload.exp * 1000);
                    const now = new Date();
                    console.log('Token expiry:', expiry);
                    console.log('Token is ' + (expiry > now ? 'valid' : 'expired'));
                } catch (e) {
                    console.error('Error decoding token payload:', e);
                }
            } else {
                console.error('Token is not in JWT format (should have 3 parts)');
            }
        } catch (e) {
            console.error('Error analyzing token:', e);
        }
    }
    
    if (adminUser) {
        try {
            const user = JSON.parse(adminUser);
            console.log('Admin user:', user);
            console.log('User role:', user.loai_tai_khoan);
        } catch (e) {
            console.error('Error parsing admin user data:', e);
        }
    }
    
    console.groupEnd();
    
    // Test API call
    testContactAPI();
}

// Test the contact API directly
async function testContactAPI() {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        console.error('Cannot test API: No admin token available');
        return;
    }
    
    console.group('🧪 Testing Contact API');
    try {
        console.log('Sending test request to /api/admin/contact/contacts');
        const response = await fetch('/api/admin/contact/contacts', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('API response successful, received data:', data);
            console.log('Number of contacts:', Array.isArray(data) ? data.length : 'N/A (not an array)');
        } else {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
        }
    } catch (error) {
        console.error('API call failed:', error);
    }
    console.groupEnd();
}

// Run immediately when script is loaded
checkAdminLogin();
