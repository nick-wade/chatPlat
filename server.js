const express = require('express');
const path = require('path');
const { join } = require('node:path');
const bodyParser = require('body-parser');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, push, onChildAdded, onValue } = require('firebase/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const session = require('express-session');


async function main() {

  function generateRandomString(length) {
    return crypto.randomBytes(length).toString('base64');
  }

  const secret = generateRandomString(32);
  const firebaseConfig = {
    apiKey: "AIzaSyDZKyuv_qI8ZZo02-uyi3qL2lOpNWjaUP0",
    authDomain: "fir-testing01wade.firebaseapp.com",
    projectId: "firebasetesting01wade",
    storageBucket: "firebasetesting01wade.appspot.com",
    messagingSenderId: "783527173299",
    appId: "1:783527173299:web:5d4c9f97d86d5bdda064c6",
    databaseURL: "firebasetesting01wade-default-rtdb.asia-southeast1.firebasedatabase.app"
  };

  initializeApp(firebaseConfig);
  const expressApp = express();
  const db = getDatabase();

  // Middleware
  expressApp.use(bodyParser.json());
  expressApp.use(express.static(join(__dirname, 'public')));
  expressApp.use(session({
    secret: secret, 
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: false
    },
  }));

  async function onDatabaseUpdate(){
    const messagesRef = ref(db, 'messages'); // Rename the variable
    let messagesArray = []

    onChildAdded(messagesRef, (snapshot) => {
      const newMessage = snapshot.val();
      
      // Add the new message to the array
      messagesArray.push(newMessage);
    
      // Get the last message from the array
      const lastMessage = messagesArray[messagesArray.length - 1];
    
      // Log the last message
      console.log(lastMessage);
    });
    
  }

  // Routes
  expressApp.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
  });
  expressApp.get('/public/login.html', async (req, res) => {
    if (req.session.loggedInUser != null) {
      res.redirect('/public/unauthorised.html');
    } else {
      res.sendFile(join(__dirname, 'public', 'login.html'));
    }
  });
  expressApp.get('/protected/chat-room.html', (req, res) => {
    if (req.session.loggedInUser != null) {
      res.sendFile(path.join(__dirname, 'protected', 'chat-room.html'));
    } else {
      res.redirect('/public/login.html');
    }
  });
  expressApp.get('/username', (req, res) => {
    const username = req.session.loggedInUser || 'Guest';
    res.json({ username });
  });
  expressApp.get('/messages', async (req, res) => {
    try {
      const msgRef = ref(db, 'messages');
      const msgSnapshot = await get(msgRef);

      if (msgSnapshot.exists()) {
        const messages = msgSnapshot.val();
        res.json({ messages });
      } else {
        res.json({ messages: [] });
      }
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  expressApp.post('/msg', async (req, res) => {
    const { username, text } = req.body;
    try {
      const msgRef = ref(db, 'messages');
      const newMsgId = await push(msgRef).key;

      await set(ref(db, `messages/${newMsgId}`), {
        username,
        text
      });

      res.json({ message: 'Message successfully sent' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save message' });
    }
  });

  expressApp.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const usernameRef = ref(db, 'users/' + username);

    try {
      const usernameSnapshot = await get(usernameRef);
      if (usernameSnapshot.exists()) {
        res.status(400).json({ error: 'Username already taken' });
        return;
      }
      const userRef = ref(db, 'users/' + username);
      await set(userRef, {username, hashedPassword});
      res.json({ message: 'User registered successfully' });
    }
    catch (error) {
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  expressApp.post('/sendDM', async (req, res) => {
    const { senderUsername, recipientUsername, status } = req.body;
    
    try {
      // Reference to both sender and recipient
      const senderRef = ref(db, `users/${senderUsername}/friendRequestsSent`);
      const recipientRef = ref(db, `users/${recipientUsername}/friendRequestsReceived`);
      
      // Generate a unique request ID (you can use push().key() for this)
      const requestID = Date.now();
  
      // Create request data
      const requestData = {
        from: senderUsername,
        to: recipientUsername,
        status: 'pending'
      };
  
      // Store the request under both users (sender and recipient)
      await set(ref(db, `users/${senderUsername}/friendRequestsSent/${requestID}`), {
        to: recipientUsername,
        status: 'pending'
      });
      
      await set(ref(db, `users/${recipientUsername}/friendRequestsReceived/${requestID}`), requestData);
  
      res.status(200).json({ message: 'Friend request sent successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send friend request' });
    }
  });
  

  expressApp.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const uRef = ref(db, 'users/' + username);
    const usernameSnapshot = await get(uRef);

    try {
      if (usernameSnapshot.exists()) {
        const dbusername = usernameSnapshot.val()['username'];
        const dbpassword = usernameSnapshot.val()['hashedPassword'];

        if (dbusername === username && await bcrypt.compare(password, dbpassword)) {
          req.session.loggedInUser = username;
          req.session.save();
          res.json({ message: "Logged in successfully" });
        } else {
          res.status(401).json({ message: "Invalid username or password" });
        }
      } else {
        res.status(400).json({ message: "User does not exist" });
      }
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  expressApp.post('/logout', async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      return res.json({ message: 'Logged out successfully' });
    });
  });

  const port = 3000;
  expressApp.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  //onDatabaseUpdate();
}

main();
