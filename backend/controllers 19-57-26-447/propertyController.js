import Property from "../models/Property.js";

// ADD PROPERTY
export const addProperty = async (req, res) => {
  try {
    const images = req.files?.map(file => file.filename) || [];

    const property = new Property({
      ...req.body,
      images,
    });

    await property.save();

    res.json({
      message: "Property added successfully",
      property,
    });
  } catch (err) {
    // console.error(err);
    res.status(500).json({ error: "Property add failed" });
  }
};


// GET PROPERTY BY ID
export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json(property);
  } catch {
    res.status(404).json({ error: "Property not found" });
  }
};

// CHECK AVAILABILITY (Dummy)
export const checkAvailability = (req, res) => {
  res.json({ available: true });
};

// RESERVE DATES (Dummy)
export const reserveDates = (req, res) => {
  res.json({ reserved: true });
};

export const updateProperty = async (req, res) => {
  try {
    const images = req.files?.map(file => file.path || file.filename);

    const updateData = { ...req.body };
    if (images && images.length > 0) {
      updateData.images = images;
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ message: "Property updated", property });
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
};
export const deleteProperty = async (req, res) => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: "Property deleted" });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
};
