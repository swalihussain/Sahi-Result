async function run() {
  const mapUrl = "https://maps.google.com/maps?q=Thennam+Juma+Masjid&t=&z=15&ie=UTF8&iwloc=&output=embed";
  
  const res = await fetch('https://sahi-result.onrender.com/api/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'admin_auth=authenticated'
    },
    body: JSON.stringify({ map_iframe_url: mapUrl })
  });

  const data = await res.json();
  console.log("Response:", data);
}

run().catch(console.error);
