const minimist = require('minimist');
const axios = require('axios');
const moment = require('moment');
const debug = require('debug')('github-activity');
const fs = require('fs-extra');

// Function to Fetch GitHub Activity
const fetchGitHubActivity = async (username) => {
    try {
        debug('Fetching GitHub activity for user:', username);
        const response = await axios.get(`https://api.github.com/users/${username}/events`);
        return response.data;
    } catch (error) {
        if (error.response) {
            debug('Error Response:', error.response.status, error.response.statusText);
            console.error(`Error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
            debug('Error Request:', error.request);
            console.error('Error: No response received from the server.');
        } else {
            debug('Error Message:', error.message);
            console.error('Error:', error.message);
        }
        return [];
    }
};

// Function to Display Activity
const displayActivity = (events, filter) => {
    const filteredEvents = events.filter(event => 
        !filter || event.type === filter
    );
    filteredEvents.forEach(event => {
        const { type, created_at, payload } = event;
        const formattedDate = moment(created_at).format('DD MMMM, YYYY, h:mm:ss a');
        console.log(`[${formattedDate}] ${type}`);
        if (type === 'PushEvent') {
            payload.commits.forEach(commit => {
                console.log(`- ${commit.message}`);
            });
        } else if (type === 'PullRequestEvent') {
            console.log(`- ${payload.pull_request.title}`);
        }
    });
};

// Function to Save Data to a File
const saveToFile = (data, filename) => {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Data saved to ${filename}`);
};

// Function to Generate HTML Report
const generateReport = (events) => {
    const commits = events.filter(event => event.type === 'PushEvent');
    const labels = commits.map(event => moment(event.created_at).format('YYYY-MM-DD'));
    const values = commits.map(event => event.payload.commits.length);

    const chartData = { labels, values };
    const template = fs.readFileSync('report.html', 'utf-8');
    const report = template.replace('{{data}}', JSON.stringify(chartData));
    fs.writeFileSync('report.html', report, 'utf-8');
    debug('Report generated at report.html');
    console.log('Report generated at report.html');
};

// Parse Command Line Arguments
const argv = minimist(process.argv.slice(2));
const username = argv.username || '48Naveenkumar';
const filter = argv.filter || null;
const outputFile = argv.output || 'github-activity.json';

// Fetch, Display, Save GitHub Activity and Generate Report
fetchGitHubActivity(username).then(events => {
    displayActivity(events, filter);
    saveToFile(events, outputFile);
    generateReport(events);
});
