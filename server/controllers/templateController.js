import EmailTemplate from "../models/EmailTemplate.js";

// @desc    Get all templates for recruiter
// @route   GET /api/templates
// @access  Private
const getTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    console.error("Get Templates Error:", error.message);
    res.status(500).json({ message: "Server error while fetching email templates" });
  }
};

// @desc    Create a new template
// @route   POST /api/templates
// @access  Private
const createTemplate = async (req, res) => {
  try {
    const { name, subject, body } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ message: "Please fill in all template fields" });
    }

    const template = await EmailTemplate.create({
      userId: req.user._id,
      name,
      subject,
      body,
    });

    res.status(201).json(template);
  } catch (error) {
    console.error("Create Template Error:", error.message);
    res.status(500).json({ message: "Server error while creating email template" });
  }
};

// @desc    Update a template
// @route   PUT /api/templates/:id
// @access  Private
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body } = req.body;

    const template = await EmailTemplate.findOne({ _id: id, userId: req.user._id });
    if (!template) {
      return res.status(404).json({ message: "Email template not found" });
    }

    if (name) template.name = name;
    if (subject) template.subject = subject;
    if (body) template.body = body;

    const updatedTemplate = await template.save();
    res.json(updatedTemplate);
  } catch (error) {
    console.error("Update Template Error:", error.message);
    res.status(500).json({ message: "Server error while updating email template" });
  }
};

// @desc    Delete a template
// @route   DELETE /api/templates/:id
// @access  Private
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await EmailTemplate.findOne({ _id: id, userId: req.user._id });
    if (!template) {
      return res.status(404).json({ message: "Email template not found" });
    }

    await template.deleteOne();
    res.json({ message: "Email template deleted successfully" });
  } catch (error) {
    console.error("Delete Template Error:", error.message);
    res.status(500).json({ message: "Server error while deleting email template" });
  }
};

export {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
