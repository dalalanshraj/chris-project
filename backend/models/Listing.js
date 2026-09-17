import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    // ✅ PROPERTY TAB
    property: {
      type: new mongoose.Schema(
        {
          title: String,

          category: String,

          
          calendarSource: {
            type: String,
            enum: ["ical", "manual"],
            default: "manual",
          },

          type: String,
          bedrooms: Number,
          bathrooms: Number,
          maxSleeps: Number,
          email: String,
          phone:String,
          altEmail: String,
          altPhone: String,
           iVacationPropertyId: {
        type: String,
        default: "",
      },
        },
        { _id: false },
      ),
      default: {},
    },

    // ✅ DESCRIPTION
    description: {
      type: String,
      default: "",
    },

    // ✅ AMENITIES (100+ checkboxes)
    amenities: {
      type: Object,
      default: {},
    },

    // ✅ ACTIVITIES
    activities: {
      type: Object,
      default: {},
    },

    // ✅ PHOTOS
    photos: {
      type: [
        {
          url: String,
          order: Number,
        },
      ],
      default: [],
    },

    // ✅ VIDEO
    video: {
      youtube: String,
      virtualTour: String,
    },

    // ✅ RATES
    rates: {
      type: [
        {
          season: String,
          from: Date,
          to: Date,
          nightly: Number,
          weekly: Number,
          monthly: Number,
          minNights: Number,
        },
      ],
      default: [],
    },

    // ✅ Extra Fee

    extraFees: [
      {
        name: { type: String, required: true },
        value: { type: Number, required: true },

        // $ or %
        type: {
          type: String,
          enum: ["$", "%"],
          default: "$",
        },

        // mandatory / optional
        option: {
          type: String,
          enum: ["mandatory", "optional"],
          default: "mandatory",
        },
      },
    ],

    // ✅ LOCATION
    location: {
      lat: Number,
      lng: Number,
      address: String,
    },
    // reviews
    reviews: [
      {
        name: String,
        email: String,
        rating: Number,
        title: String,
        message: String,
        stayDate: String,

        published: {
          type: Boolean,
          default: false,
        },

        reply: String,

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    //  Calendar Model

    calendar: [
      {
        date: Date,

        status: {
          type: String,
          enum: ["A", "R", "H", "CIN", "COUT"],
          default: "A",
        },

        source: {
          type: String,
          enum: ["internal", "booking", "admin", "ical"],
          default: "admin",
        },

        customerName: String,

        customerEmail: String,

        customerPhone: String,

        comment: String,

        checkInDate: Date,

        checkOutDate: Date,
      },
    ],
    icalSources: [
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },
    url: {
      type: String,
      default: "",
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
],

    icalUrl: {
      type: String,
      default: "",
    },
  },

  { timestamps: true },
);

export default mongoose.model("Listing", listingSchema);
