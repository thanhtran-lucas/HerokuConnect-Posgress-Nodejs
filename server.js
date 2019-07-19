const express = require('express');
const path = require('path');
const { Client } = require('pg');
var bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000;

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});
client.connect();

var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (httpRequest, httpResponse) => {
    const query = 'SELECT Id, sfid, Name, FirstName, LastName, Email, Phone FROM salesforce.Contact ORDER BY lastmodifieddate DESC LIMIT 15';

    client.query(query).then(queryResult => {
        httpResponse.render('pages/index', { contacts: queryResult.rows});
    }).catch(e => console.error(e.stack));
});

app.post('/search', (httpRequest, httpResponse) => {
    const query = {
        text: 'SELECT Id, sfid, Name, FirstName, LastName, Email, Phone FROM salesforce.Contact WHERE Email LIKE $1',
        values : ['%' + httpRequest.body.searchemail + '%']
    };

    client.query(query).then(queryResult => {
        httpResponse.render('pages/index', { contacts: queryResult.rows});
    }).catch(e => console.error(e.stack));
});

app.post('/updatecontact', (httpRequest, httpResponse) => {
    const query = {
        text: 'UPDATE salesforce.Contact SET Email = $1, Phone = $2 WHERE id = $3',
        values: [ httpRequest.body.email, httpRequest.body.phone, httpRequest.body.id ]
    };
	
    client.query(query).then(queryResult => {
        httpResponse.json(queryResult);
    }).catch(e => console.error(e.stack));
});

app.post('/createcontact', (httpRequest, httpResponse) => {
    let randomId = Math.random().toString(36).substring(7);
    const query = {
        text: 'INSERT INTO salesforce.Contact (FirstName, LastName, Email, Phone, custom_external_id__c) VALUES ($1, $2, $3, $4, $5)',
        values: [ httpRequest.body.firstname, httpRequest.body.lastname, httpRequest.body.email, httpRequest.body.phone, randomId ]
    };

    client.query(query).then(queryResult => {
        httpResponse.json(queryResult);
    }).catch(e => console.error(e.stack));
});

app.post('/deletecontact', (httpRequest, httpResponse) => {
    const query = {
        text: 'DELETE FROM salesforce.Contact WHERE id = $1',
        values: [ httpRequest.body.contactid]
    };
    client.query(query).then(queryResult => {
        httpResponse.json(queryResult);
    }).catch(e => console.error(e.stack));
});


app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
