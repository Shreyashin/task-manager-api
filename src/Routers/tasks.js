const expresss = require('express')
const Task = require('../models/tasks')
const auth= require('../middleware/auth')
const router = new expresss.Router()

// Update the Task
router.patch('/task/:id', auth, async(req, res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdate = ['description', 'completed']
    const IsValidOperations = updates.every((update)=>{
        return allowedUpdate.includes(update)
    })

    if(!IsValidOperations){
        return res.status(400).send({error:"Invalid Operation."})
    }
    try{
        const task = await Task.findOne({ _id:req.params.id, Owner: req.user._id})
        // const task = await Task.findById(req.params.id)
      
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
        if(!task){
            res.status(404).send()
        }
        updates.forEach((update)=>{
            task[update]=req.body[update]
        })
        await task.save()
        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }
})

// Delete the task
router.delete('/task/:id', auth, async(req, res)=>{
    try{
        const task = await Task.findOneAndDelete({ _id:req.params.id, Owner:req.user._id})
        if(!task){
            res.status(404).send({error : 'No such task found'})
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }
})

// Get the data : /task?completed=true
// get the data : /task/?liit=1&skip=4
// Get the data : /task?soryBy=createdAt:desc
router.get('/task', auth, async (req, res)=>{
    const match = {}
    const sort={}
    if(req.query.completed){
        match.completed = req.query.completed === 'true' 
    }
    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try{
    await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate() 
        res.send(req.user.tasks)
    }catch(e){
        res.status(500).send(e)
    }
})

router.get('/task/:id', auth, async (req, res)=>{
    const _id = req.params.id
    try{
               const task = await Task.findOne({ _id, Owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }
})

router.post('/task', auth, async (req, res)=>{
    // const tasks = new Task(req.body)
    const tasks = new Task({
        ...req.body,
        Owner: req.user._id
    })
    try{
        await tasks.save()
        res.status(201).send(tasks)
    }catch(e){
        res.status(400).send(e)
    }
})


module.exports = router