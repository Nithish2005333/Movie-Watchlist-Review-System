import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testAuth() {
  console.log('🧪 Testing Movie Vault Authentication System\n');

  try {
    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    const registerResponse = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        DOB: '1990-01-01',
        gender: 'male',
        phone: '1234567890',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'password123'
      })
    });

    const registerResult = await registerResponse.json();
    console.log('Registration result:', registerResult.success ? '✅ Success' : '❌ Failed');

    // Test 2: Login with the registered user
    console.log('\n2. Testing user login...');
    const loginResponse = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'johndoe',
        password: 'password123'
      })
    });

    const loginResult = await loginResponse.json();
    console.log('Login result:', loginResult.success ? '✅ Success' : '❌ Failed');

    if (loginResult.success) {
      const sessionId = loginResult.sessionId;
      console.log('Session ID:', sessionId);

      // Test 3: Add a movie to watchlist
      console.log('\n3. Testing movie addition to watchlist...');
      const addMovieResponse = await fetch(`${BASE_URL}/api/movies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({
          title: 'The Shawshank Redemption',
          description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency. The film tells the story of banker Andy Dufresne, who is sentenced to life in Shawshank State Penitentiary for the murder of his wife and her lover, despite his claims of innocence. Over the following two decades, he befriends a fellow prisoner, contraband smuggler Ellis "Red" Redding, and becomes instrumental in a money laundering operation led by the prison warden Samuel Norton.',
          genres: ['Drama', 'Crime'],
          releaseYear: 1994,
          rating: 9.3,
          posterImage: 'https://example.com/poster.jpg',
          ottPlatforms: ['Netflix', 'Amazon Prime'],
          notes: 'One of my favorite movies! This film is a masterpiece of storytelling and character development. The performances by Tim Robbins and Morgan Freeman are absolutely outstanding. The themes of hope, friendship, and redemption are beautifully portrayed throughout the film.'
        })
      });

      const addMovieResult = await addMovieResponse.json();
      console.log('Add movie result:', addMovieResult.success ? '✅ Success' : '❌ Failed');

      if (addMovieResult.success) {
        const movieId = addMovieResult.movie._id || addMovieResult.movie.id;

        // Test 4: Get user's watchlist
        console.log('\n4. Testing watchlist retrieval...');
        const getMoviesResponse = await fetch(`${BASE_URL}/api/movies`, {
          headers: {
            'Authorization': `Bearer ${sessionId}`
          }
        });

        const getMoviesResult = await getMoviesResponse.json();
        console.log('Get movies result:', getMoviesResult.success ? '✅ Success' : '❌ Failed');
        console.log('Movies count:', getMoviesResult.movies?.length || 0);

        // Test 5: Delete movie from watchlist
        console.log('\n5. Testing movie deletion...');
        const deleteMovieResponse = await fetch(`${BASE_URL}/api/movies/${movieId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${sessionId}`
          }
        });

        const deleteMovieResult = await deleteMovieResponse.json();
        console.log('Delete movie result:', deleteMovieResult.success ? '✅ Success' : '❌ Failed');

        // Test 6: Logout
        console.log('\n6. Testing logout...');
        const logoutResponse = await fetch(`${BASE_URL}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionId}`
          }
        });

        const logoutResult = await logoutResponse.json();
        console.log('Logout result:', logoutResult.success ? '✅ Success' : '❌ Failed');
      }
    }

    console.log('\n🎉 Authentication system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuth();
