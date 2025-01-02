const Notes = require("./Models");

let createNote = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: "Please include both title and description" });
        }

        // Create a new note with the title, description and user ID
        const note = new Notes({
            title,
            description,
            user: req.user.id // Assuming the user's ID is stored in req.user._id
        });

        // Save the note to the database
        await note.save();

        // Return a success response
        res.json({ message: "Note created successfully!", note });

    } catch (error) {
        console.error("Error while creating note:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

let getNotes = async (req, res) => {
    try {
        // Get user ID from req.user
        const userId = req.user.id;

        // Query notes for this user
        const notes = await Notes.find({ user: userId });

        // Return the notes
        res.json({ notes });
    } catch (error) {
        console.error("Error while getting notes:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

let deleteNote = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Please include the id of the note you want to delete" });
        }

        let note = await Notes.findById(id);

        // Check if the note exists
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        // Check if the user is authorised to edit the note (assuming the note has a user field)
        if (note.user._id.toString() !== req.user.id) {
            return res.status(403).json({ error: "You are not authorised to delete this note" });
        }

        // Save the edited note
        note = await Notes.findByIdAndDelete(id)

        res.json({ message: "Note deleted successfully!", note });
    } catch (error) {
        console.error("Error while deleting note:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

let editNote = async (req, res) => {
    try {
        const { id, title, description } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Please include the id of the note you want to edit" });
        }

        const note = await Notes.findById(id);

        // Check if the note exists
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        // Check if the user is authorised to edit the note (assuming the note has a user field)
        if (note.user._id.toString() !== req.user.id) {
            return res.status(403).json({ error: "You are not authorised to edit this note" });
        }

        // Update the fields if provided
        if (title) {
            note.title = title;
        }
        if (description) {
            note.description = description;
        }

        // Save the edited note
        await note.save();

        res.json({ message: "Note editted successfully!", note });

    } catch (error) {
        console.error("Error while editing note:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    createNote,
    getNotes,
    deleteNote,
    editNote,
};
