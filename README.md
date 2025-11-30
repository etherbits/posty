# Posty 
app for scheduling posts on Mastodon

## Team members
- Nikoloz Kvrivishvili (etherbits)
- Badreldin Moussa (itsb2dr)
- Lobjanidze Tsotne (update this with your github username)

## How to run

First add an ".env" file to the backend directory and fill it with values like in the .env.sample file. (Contact me so I can provide them)

Next, install the dependencies for the frontend and backend:

```
cd frontend
npm install
cd ../backend
npm install
```

Then, start the backend server:

```
cd backend
npm run start
```

Finally, start the frontend server:

```
cd frontend
npm run dev
```

## Scripts

I have added some scripts to make working with the DB easier:

(Inside backend directory)

```
npm run db:reset // Resets the database
npm run db:setup // Sets up the database with tables
npm run db:teardown // Tears down the database (removes the tables entirely)
npm run make-admin [username here] // Makes an admin user (requires username to be passsed of an already created user)
```
