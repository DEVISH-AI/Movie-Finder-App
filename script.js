let apiKey = "your-api-key"; 

let searchInput = document.getElementById("search-input");
let searchButton = document.getElementById("search-btn");
let resultsContainer = document.getElementById("resultsContainer");

searchButton.addEventListener("click", () => {
  let query = searchInput.value.trim();
  if (query !== "") {
    fetchMovies(query);
  } else {
    resultsContainer.innerHTML = `<p>Please enter a movie name..</p>`;
  }
});


function fetchMovies(query) {
  let url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${query}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.Response === "True") {

       // Filter movies with valid posters before displaying
        const moviesWithPosters = data.Search.filter(movie => 
          movie.Poster && 
          movie.Poster !== "N/A" && 
          movie.Poster.startsWith('http')
        );
        
        if (moviesWithPosters.length > 0) {
          displayMovies(moviesWithPosters);
        } else {
          resultsContainer.innerHTML = `<p>No movies found with posters :(</p>`;
        }
      } else {
        resultsContainer.innerHTML = `<p>No results found :(</p>`;
      }
    })
    .catch(error => {
      resultsContainer.innerHTML = `<p>Something went wrong...</p>`;
      console.error("Error:", error);
    });
}

const trendingSection = document.querySelector(".trending-section");
// const resultContainer = document.getElementById("result-container");


function displayMovies(movies) {
  resultsContainer.innerHTML = "";

   if (movies.length > 0) {
    trendingSection.style.display = "none";
  }

    movies.forEach(movie => {
    let card = document.createElement("div");
    card.classList.add("movie-card");

    card.innerHTML = `
     <img src="${movie.Poster}" alt="${movie.Title}">
      <h3>${movie.Title}</h3>
      <p>${movie.Year}</p>
      <button onclick="getMovieDetails('${movie.imdbID}')">More Info</button>
      `;

    resultsContainer.appendChild(card);

  });
}

function getMovieDetails(imdbID) {
  fetch(`https://www.omdbapi.com/?apikey=your-api-key&i=${imdbID}`)
    .then(response => response.json())
    .then(data => {
      showModal(data);
    })
    .catch(error => {
      console.error("Oops, something went wrong ..", error);
    });
}

function showModal(movie) {
  let modal = document.getElementById("movie-modal");
  let modalBody = document.getElementById("modal-body");

  modalBody.innerHTML = `
    <h2>${movie.Title}</h2>
    <img src="${movie.Poster}" alt="${movie.Title}" />
    <p><strong>Year:</strong> ${movie.Year}</p>
    <p><strong>Genre:</strong> ${movie.Genre}</p>
    <p><strong>Plot:</strong> ${movie.Plot}</p>
    <p><strong>IMDB Rating:</strong> ⭐ ${movie.imdbRating}</p>
  `;

  modal.style.display = "flex";
}

document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("movie-modal").style.display = "none";
});

document.addEventListener("click", function (e) {
  if (e.target && e.target.classList.contains("more-info-btn")) {
    let imdbID = e.target.getAttribute("data-id");
    getMovieDetails(imdbID);
  }
});


const genreMovies = {
  horror: ['The Conjuring', 'Insidious', 'IT', 'Halloween', 'Scream'],
  comedy: ['The Hangover', 'Superbad', 'Anchorman', 'Dumb and Dumber', 'Bridesmaids'],
  action: ['John Wick', 'The Avengers', 'Mad Max', 'Die Hard', 'Mission Impossible'],
  romance: ['Titanic', 'The Notebook', 'Dirty Dancing', 'Pretty Woman', 'Ghost'],
  thriller: ['Gone Girl', 'Se7en', 'Shutter Island', 'Zodiac', 'Prisoners'],
  drama: ['The Shawshank Redemption', 'Forrest Gump', 'Good Will Hunting', 'A Beautiful Mind'],
  animation: ['Toy Story', 'Finding Nemo', 'Shrek', 'Frozen', 'The Lion King'],
  scifi: ['Star Wars', 'Blade Runner', 'The Matrix', 'Interstellar', 'Avatar']
};

// Cache functions
function getCachedGenre(genre) {
  const cached = localStorage.getItem(`genre_${genre}`);
  if (cached) {
    const data = JSON.parse(cached);
    const oneDay = 24 * 60 * 60 * 1000;
    if ((new Date().getTime() - data.timestamp) < oneDay) {
      return data.movies;
    }
    localStorage.removeItem(`genre_${genre}`);
  }
  return null;
}

function cacheGenreData(genre, movies) {
  localStorage.setItem(`genre_${genre}`, JSON.stringify({
    timestamp: new Date().getTime(),
    movies: movies
  }));
}

// Main fetch function
function fetchGenreMovies(genre) {
  const cached = getCachedGenre(genre);
  if (cached) {
    document.querySelector(".trending-section").style.display = "none";
    displayMovies(cached);
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  
  // Show loading
  document.getElementById('genreLoading').classList.remove('hidden');
  document.querySelectorAll('.genre-btn').forEach(btn => btn.disabled = true);
  document.querySelector(".trending-section").style.display = "none";
  
  // Fetch movies with enhanced error handling
  const promises = genreMovies[genre].map(title => 
    fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${title}&type=movie`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.Response === 'True' && data.Search) {
          // Filter out movies with invalid or missing data
          return data.Search.filter(movie => 
            movie && 
            movie.Title && 
            movie.imdbID && 
            movie.Year &&
            movie.Poster && 
            movie.Poster !== "N/A" && 
            movie.Poster.startsWith('http')
          );
        }
        return [];
      })
      .catch(() => {
        // Suppress console errors for failed requests
        return [];
      })
  );
  
  Promise.all(promises).then(results => {
    const allMovies = results.flat();
    const uniqueMovies = allMovies.filter((movie, index, self) => 
      index === self.findIndex(m => m.imdbID === movie.imdbID)
    );
    
    if (uniqueMovies.length > 0) {
      cacheGenreData(genre, uniqueMovies);
      displayMovies(uniqueMovies);
      resultsContainer.scrollIntoView({ behavior: 'smooth' });
    } else {
      resultsContainer.innerHTML = `<p>No ${genre} movies found!</p>`;
    }
  }).finally(() => {
    document.getElementById('genreLoading').classList.add('hidden');
    document.querySelectorAll('.genre-btn').forEach(btn => btn.disabled = false);
  });
}

// Clean expired cache on load
document.addEventListener('DOMContentLoaded', () => {
  Object.keys(genreMovies).forEach(genre => {
    const cached = localStorage.getItem(`genre_${genre}`);
    if (cached) {
      const data = JSON.parse(cached);
      const oneDay = 24 * 60 * 60 * 1000;
      if ((new Date().getTime() - data.timestamp) > oneDay) {
        localStorage.removeItem(`genre_${genre}`);
      }
    }
  });
});

// Dark mode toggle functionality
    function toggleTheme() {
        const body = document.body;
        const themeIcon = document.getElementById('theme-icon');
        
        if (body.getAttribute('data-theme') === 'dark') {
            body.removeAttribute('data-theme');
            themeIcon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        }
    }

    // Load saved theme on page load
    document.addEventListener('DOMContentLoaded', function() {
        const savedTheme = localStorage.getItem('theme');
        const themeIcon = document.getElementById('theme-icon');
        
        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fas fa-sun';
        } else {
            themeIcon.className = 'fas fa-moon';
        }
    });

    //Triple Click on Logo/Title (Most Sneaky!)
let clickCount = 0;
let clickTimer = null;

document.querySelector('.hero h1').addEventListener('click', function() {
    clickCount++;
    
    if (clickCount === 1) {
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 800); // Reset after 800ms
    } else if (clickCount === 3) {
        clearTimeout(clickTimer);
        clickCount = 0;
        
        // Clear cache
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith("genre_")) {
                localStorage.removeItem(key);
            }
        });
        
        console.log("🔥 Secret cache clear activated!");
        
        // Show temporary notification
        const notification = document.createElement('div');
        notification.innerHTML = '🔥 Cache Cleared!';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4d4d;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            z-index: 10000;
            font-weight: bold;
            animation: fadeOut 3s ease forwards;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; transform: translateX(-50%) translateY(0px); }
        70% { opacity: 1; transform: translateX(-50%) translateY(0px); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(style);

// document.getElementById("clearCacheBtn").addEventListener("click", () => {
//   Object.keys(localStorage).forEach(key => {
//     if (key.startsWith("genre_")) {
//       localStorage.removeItem(key);
//     }
//   });
//   alert("🔥 Genre cache cleared, babe!");
// });

