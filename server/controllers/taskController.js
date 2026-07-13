import Task from "../models/Task.js";

const getTasks = async (req, res) => {
  try {
    const query = {};

    if (req.user.role !== "Admin" && req.user.role !== "HR") {
      query.userId = req.user._id;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    const tasks = await Task.find(query)
      .populate("linkedCandidateId", "fullName roleApplied")
      .sort({ dueDate: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Get Tasks Error:", error.message);
    res.status(500).json({ message: "Server error while fetching tasks" });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, linkedCandidateId, dueDate, priority, status, category } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Please provide a task title" });
    }

    const task = await Task.create({
      userId: req.user._id,
      title,
      description: description || "",
      linkedCandidateId: linkedCandidateId || null,
      dueDate: dueDate || null,
      priority: priority || "Medium",
      status: status || "Pending",
      category: category || "Other",
    });

    const populatedTask = await Task.findById(task._id).populate("linkedCandidateId", "fullName roleApplied");
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Create Task Error:", error.message);
    res.status(500).json({ message: "Server error while creating task" });
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, linkedCandidateId, dueDate, priority, status, category } = req.body;

    const query = { _id: req.params.id };
    if (req.user.role !== "Admin" && req.user.role !== "HR") {
      query.userId = req.user._id;
    }

    let task = await Task.findOne(query);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    task.linkedCandidateId = linkedCandidateId !== undefined ? (linkedCandidateId || null) : task.linkedCandidateId;
    task.dueDate = dueDate !== undefined ? (dueDate || null) : task.dueDate;
    task.priority = priority !== undefined ? priority : task.priority;
    task.status = status !== undefined ? status : task.status;
    task.category = category !== undefined ? category : task.category;

    await task.save();
    const updatedTask = await Task.findById(task._id).populate("linkedCandidateId", "fullName roleApplied");
    res.json(updatedTask);
  } catch (error) {
    console.error("Update Task Error:", error.message);
    res.status(500).json({ message: "Server error while updating task" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== "Admin" && req.user.role !== "HR") {
      query.userId = req.user._id;
    }

    const task = await Task.findOneAndDelete(query);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Task Error:", error.message);
    res.status(500).json({ message: "Server error while deleting task" });
  }
};

export {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
