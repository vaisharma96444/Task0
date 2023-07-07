const axios = require('axios');
const { createObjectCsvWriter } = require('csv-writer');
const nodemailer = require('nodemailer');
const fs = require('fs');

const apiKey = '150b48ea4a0c4ae4b3ab5a6b930b6b66';
const csvWriter = createObjectCsvWriter({
  path: 'whois_data.csv',
  header: [
    { id: 'name', title: 'Name' },
    { id: 'domain', title: 'Domain Name' },
    { id: 'email', title: 'Email ID' },
    { id: 'phone', title: 'Phone Number' },
    { id: 'registrationDate', title: 'Registration Date' },
  ],
});

const domains = [
  'vk.com',
  'netflix.com',
  'instagram.com',
  'microsoft.com',
  'office.com',
  'pinterest.com',
];

const emailConfig = {
  service: 'your-email-service',
  auth: {
    user: 'your-email-username',
    pass: 'your-email-password',
  },
};

const cronTime = '0 0 * * *'; 

function retrieveWhoisData() {
  for (const domain of domains) {
    const apiUrl = `https://api.whoisfreaks.com/v1.0/whois?apiKey=${apiKey}&whois=live&domainName=${domain}`;

    axios
      .get(apiUrl)
      .then(response => {
        const data = response.data;

        if (data.status) {
          saveWhoisData(data);
        } else {
          console.log(`WHOIS data not found for ${domain}`);
        }
      })
      .catch(error => {
        logError(`Error retrieving WHOIS data for ${domain}: ${error}`);
      });
  }
}

function saveWhoisData(data) {
  const records = [
    {
      name: data.registrant_contact.name,
      domain: data.domain_name,
      email: data.registrant_contact.email_address,
      phone: data.registrant_contact.phone,
      registrationDate: data.create_date,
    },
  ];

  csvWriter
    .writeRecords(records, { header: false })
    .then(() => {
      console.log(`WHOIS data saved for ${data.domain_name}`);
      sendEmail(data);
    })
    .catch(error => {
      logError(`Error while saving WHOIS data ${data.domain_name} to CSV: ${error}`);
    });
}

function sendEmail(data) {
  const transporter = nodemailer.createTransport(emailConfig);

  const mailOptions = {
    from: 'your-email',
    to: 'email-of -reciver',
    subject: 'WHOIS Data',
    text: `WHOIS data for ${data.domain_name}`,
    attachments: [
      {
        filename: 'whois_data.csv',
        path: './whois_data.csv',
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logError(`Error sending email: ${error}`);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

function logError(error) {
  fs.appendFile('error.log', `${new Date().toISOString()}: ${error}\n`, err => {
    if (err) {
      console.error('Error writing to error log:', err);
    }
  });
}

function removeDuplicates() {
  const data = fs.readFileSync('whois_data.csv', 'utf8');
  const lines = data.trim().split('\n');
  const uniqueLines = Array.from(new Set(lines));
  const deduplicatedData = uniqueLines.join('\n');

  fs.writeFileSync('whois_data.csv', deduplicatedData);
}

function filterData() {
  const data = fs.readFileSync('whois_data.csv', 'utf8');
  const lines = data.trim().split('\n');
  const filteredLines = lines.filter(line => line.includes('example.com'));
  const filteredData = filteredLines.join('\n');

  fs.writeFileSync('whois_data.csv', filteredData);
}


const CronJob = require('cron').CronJob;
const job = new CronJob(cronTime, () => {
  retrieveWhoisData();
}, null, true, 'UTC');


job.start();

// Initial data retrieval
retrieveWhoisData();
