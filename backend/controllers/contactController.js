import Contact from "../models/Contact.js";
import Listing from "../models/Listing.js";

export const createContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    const contact = await Contact.create({
      name,
      email,
      phone,
      message,
    });

    // Get email from Admin Listing
    const listing = await Listing.findOne().select(
      "property.email property.altEmail property.title"
    );

    return res.status(201).json({
      success: true,

      contact,

      emails: [
        listing?.property?.email,
        listing?.property?.altEmail,
      ].filter(Boolean),

      propertyTitle: listing?.property?.title || "",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};