const route = require("express").Router();
const mongoose = require("mongoose");
const moment = require("moment");
route.get("/", (req, res) => {
    return res.json({
        success: true,
        status: "200",
        data: {}
    })
})
route.post("/", (req, res) => {
    return res.json({
        success: true,
        status: "200",
        data: {}
    })
})

route.get('/update/time/:id', async (req, res) => {

    const { id } = req.params;

    const clockinTime = moment().format('YYYY-MM-DD HH:mm');
    let updated = await mongoose.connection.db
        .collection('user')
        .updateOne({ id: id }, { $set: { clockinTime, status: true } });
    res.redirect('/');
});


route.post('/site/check', async (req, res, next) => {
    let { action, time, userId, orgId } = req.body;
    let [date, dtime] = time.split(' ');
    if (dtime <= '05:00:00') {
        date = moment(date).subtract(1, 'days').format('YYYY-MM-DD');
    }
    let event = await mongoose.connection.db
        .collection('time')
        .findOne({ date: date, userId: userId });

    if (action === 'start' && !event) {
        await mongoose.connection.db.collection('time').insertOne({
            orgId: orgId,
            userId,
            date,
            startTime: time,
            lastEventTime: time,
            isBreak: false,
        });
        return res.json({
            success: true,
            status: 200,
            message: 'Clocked in successfully',
        });
    }
    let addValue = 0;
    let updated;
    if (action === 'pause') {
        addValue = (new Date(time) - new Date(event.lastEventTime)) / 1000;
        updated = await mongoose.connection.db
            .collection('time')
            .updateOne(
                { date: date, userId: userId },
                {
                    $set: { isBreak: true, lastEventTime: time },
                    $inc: { totalTime: addValue },
                }
            );
    }
    if (action === 'resume') {
        updated = await mongoose.connection.db
            .collection('time')
            .updateOne(
                { date: date, userId: userId },
                { $set: { isBreak: false, lastEventTime: time } }
            );
    }
    if (action === 'end') {
        if (event.isBreak) {
            updated = await mongoose.connection.db
                .collection('time')
                .updateOne(
                    { date: date, userId: userId },
                    { $set: { checkOut: time, isBreak: false, lastEventTime: time } }
                );
        } else {
            addValue = (new Date(time) - new Date(event.lastEventTime)) / 1000;
            updated = await mongoose.connection.db
                .collection('time')
                .updateOne(
                    { date: date, userId: userId },
                    {
                        $set: { checkOut: time, lastEventTime: time },
                        $inc: { totalTime: addValue },
                    }
                );
        }
    }
    return res.json({
        success: true,
        status: 200,
        data: updated,
        message: 'Event successfully',
    });
});

route.post('/site/user', async (req, res, next) => {
    let { name, email, position } = req.body;
    let user = await mongoose.connection.db.collection('user').findOne({ email });
    if (user) {
        return res.json({
            success: false,
            status: 400,
            message: 'User already exists',
        });
    }
});

route.post('/site/user/fetch', async (req, res, next) => {
    try {
        let { id } = req.body;
        let user = await mongoose.connection.db.collection('user').findOne({ id });
        if (!user) {
            return res.json({
                success: false,
                status: 400,
                message: 'User not found',
            });
        }
        return res.json({
            success: true,
            status: 200,
            data: user,
            message: 'User fetched successfully',
        });
    } catch (error) {
        return res.json({
            success: false,
            status: 500,
            message: 'Internal server error',
        });
    } //#5D5CDE
});

route.get('/site/user/report/:id', async (req, res, next) => {
    try{
        let { time } = req.query;
        let { id } = req.params;
        let [date, dtime] = time.split(' ');
        if (dtime <= '05:00:00') {
            date = moment(date).subtract(1, 'days').format('YYYY-MM-DD');
        }
        let user = await mongoose.connection.db
            .collection('user')
            .aggregate([
                {
                    $match: { org_id: id },
                },
                {
                    $lookup: {
                        from: 'time',
                        let: { userId: '$id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$userId', '$$userId'] },
                                            { $eq: ['$date', date] },
                                        ],
                                    },
                                },
                            },
                        ],
                        as: 'time',
                    },
                },
                {
                    $unwind: { path: '$time', preserveNullAndEmptyArrays: true },
                },
                {
                    $project: {
                        name: 1,
                        email: 1,
                        id: 1,
                        position: 1,
                        isActive: 1,
                        clockinTime: 1,
                        total: '$time.totalTime',
                        date: '$time.date',
                        startTime: '$time.startTime',
                        checkOut: '$time.checkOut',
                        isBreak: '$time.isBreak',
                        position: '$position',
                        lastEventTime: '$time.lastEventTime',
                    },
                },
            ])
            .toArray();
        return res.json({
            success: true,
            status: 200,
            data: user,
            message: 'User report',
        });
    } catch (err){
        return res.json({
            success: false,
            status: 500,
            message: err.message,
            error: err.stack,

        })
    }
});
//route.post("/default/file/uploader", Helper.fileUploader)
module.exports = route;