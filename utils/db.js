const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.bmhdr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, { dbName: 'NAS' })
.then(() => console.log(`MongoDB Connected!`))
.catch(err => console.log(err));

process.on('SIGINT', async () => {
    await mongoose.connection.close()
    .then(() => console.log(`\nMongoDB connection closed!`))
    .catch(err => console.log(err));
    process.exit(0);
});