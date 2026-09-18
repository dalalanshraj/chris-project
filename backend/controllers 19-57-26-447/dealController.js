import Deal from "../models/Deal.js";

export const createDeal = async (req, res) => {
  try {
    if (!req.body.listingId) {
  return res.status(400).json({ error: "Listing ID required" });
}
    // console.log("BODY 👉", req.body); // 👈 ADD THIS

    const deal = new Deal(req.body);

    await deal.save();

    // console.log("SAVED DEAL 👉", deal); // 👈 ADD THIS

    res.json(deal);

  } catch (err) {
    console.error("❌ CREATE DEAL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
export const getDeals = async (req, res) => {
  try {
    const { listingId } = req.params;

    const deals = await Deal.find({
      listingId: listingId, // ✅ THIS WAS MISSING
    }).populate("listingId");

    res.json(deals);

  } catch (err) {
    console.error("❌ GET DEAL ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};
export const updateDeal = async (req,res)=>{
 try{

   const {id} = req.params;

   const deal = await Deal.findById(id);

   if(!deal){
     return res.status(404).json({message:"Deal not found"})
   }

   // end date change nahi kar sakte
   delete req.body.dealEndDate;

   const updated = await Deal.findByIdAndUpdate(
      id,
      req.body,
      {new:true}
   )

   res.json(updated)

 }catch(err){
   res.status(500).json({error:err.message})
 }
}   
export const deleteDeal = async (req,res)=>{
 try{

  const {id} = req.params;

  await Deal.findByIdAndDelete(id);

  res.json({message:"Deal deleted"})

 }catch(err){
  res.status(500).json({error:err.message})
 }
}
export const getActiveDeals = async (req, res) => {
  try {
    const today = new Date();

    const deals = await Deal.find().populate("listingId");

    const listings = deals
      .filter((d) => {
        if (!d.listingId) return false;

        // ✅ ONLY DISPLAY FILTER (RELAXED)
        return (
          d.displayFrom &&
          d.displayEnd &&
          new Date(d.displayFrom) <= today &&
          new Date(d.displayEnd) >= today
        );
      })
      .map((d) => ({
        ...d.listingId._doc,
        deal: d,
      }));

    console.log(" FINAL DEAL LIST 👉", listings);

    res.json(listings);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};