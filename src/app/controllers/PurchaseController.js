const Ad = require('../models/Ad')
const User = require('../models/User')
const Purchase = require('../models/Purchase')
const Queue = require('../services/Queue')
const PurchaseMail = require('../jobs/PurchaseMail')

class PurchaseController {
  async store (req, res) {
    const { ad, content } = req.body

    const purchaseAd = await Ad.findById(ad).populate('author')
    const user = await User.findById(req.userId)

    Queue.create(PurchaseMail.key, {
      ad: purchaseAd,
      content,
      user
    }).save()

    if (purchaseAd.purchasedBy) {
      return res.status(400).json({ error: 'Add already sold' })
    }

    const purchaseIntention = await Purchase.create({
      ...req.body,
      buyer: req.userId
    })
    return res.json(purchaseIntention)
  }

  async sold (req, res) {
    const { id } = req.params

    const { ad } = await Purchase.findById(id).populate({
      path: 'ad',
      populate: {
        path: 'author'
      }
    })

    if (!ad.author._id.equals(req.userId)) {
      return res.status(401).json({ error: "You aren't the ad author" })
    }

    ad.purchasedBy = id

    await ad.save()

    return res.json(ad)
  }
}

module.exports = new PurchaseController()
