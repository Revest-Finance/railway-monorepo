import cron from "node-cron";

const run = async () => {
    // get all events from the db
    // for each event, check if the event has a task runner
    // if it doesn't, add a task runner
    // for each task runner, check if the task runner has a task
};

cron.schedule(`* * * * *`, async () => {
    // run(1);
});
