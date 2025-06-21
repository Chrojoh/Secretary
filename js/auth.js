import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

function getEmailFromUsername(username) {
  return `${username}@trial.local`;
}

// Clear any stuck authentication states
function clearAuthState() {
  console.log("🧹 Clearing authentication state...");
  localStorage.clear();
  sessionStorage.clear();
}

window.signup = async function () {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const email = getEmailFromUsername(username);

  if (!username.trim()) {
    document.getElementById("error").textContent = "Please enter a username";
    return;
  }

  if (!password.trim()) {
    document.getElementById("error").textContent = "Please enter a password";
    return;
  }

  try {
    console.log("🔐 Creating new user account...");
    
    // Clear any existing auth state
    clearAuthState();
    
    await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "usernames", username), { uid: auth.currentUser.uid });
    
    console.log("✅ User created successfully");
    
    // **FIXED REDIRECT** - Go to main dashboard, not old dashboard
    window.location.href = "main-dashboard.html";
    
  } catch (err) {
    console.error("❌ Signup error:", err);
    document.getElementById("error").textContent = err.message;
  }
};

window.login = async function () {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const email = getEmailFromUsername(username);

  if (!username.trim()) {
    document.getElementById("error").textContent = "Please enter a username";
    return;
  }

  if (!password.trim()) {
    document.getElementById("error").textContent = "Please enter a password";
    return;
  }

  try {
    console.log("🔐 Logging in user...");
    
    // Clear any existing auth state first
    clearAuthState();
    
    // Check if username exists
    const ref = doc(db, "usernames", username);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error("Username not found");
    }

    // Sign in with email/password
    await signInWithEmailAndPassword(auth, email, password);
    
    console.log("✅ Login successful");
    
    // **FIXED REDIRECT** - Go to main dashboard, not old dashboard
    window.location.href = "main-dashboard.html";
    
  } catch (err) {
    console.error("❌ Login error:", err);
    document.getElementById("error").textContent = err.message;
  }
};

// Global logout function for consistency across all pages
window.logout = async function() {
  if (confirm("Are you sure you want to logout?")) {
    try {
      console.log("👋 Logging out...");
      
      // Clear local state first
      clearAuthState();
      
      // Sign out from Firebase
      await signOut(auth);
      
      console.log("✅ Logout successful");
      
      // Force redirect to login
      window.location.replace('index.html');
      
    } catch (error) {
      console.error("❌ Logout error:", error);
      alert("Error logging out: " + error.message);
      
      // Force redirect even if signOut fails
      window.location.replace('index.html');
    }
  }
};

// Emergency logout for stuck sessions
window.emergencyLogout = async function() {
  console.log("🚨 Emergency logout triggered");
  try {
    clearAuthState();
    await signOut(auth);
  } catch (error) {
    console.error("Emergency logout error:", error);
  }
  
  // Force redirect regardless of signOut success
  window.location.replace('index.html');
};

// Check auth state on page load for login page
window.addEventListener('load', function() {
  // If we're on the login page and user is already logged in, redirect to dashboard
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("👤 User already logged in, redirecting to dashboard");
        window.location.replace('main-dashboard.html');
      }
    });
  }
});

console.log("✅ Authentication system loaded with proper redirects");
