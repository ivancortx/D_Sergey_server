'use strict'
const admin = require('../config/firebase-config')
const firestore = admin.firestore()

const saveUser = async (req, res) => {
  try {
    const adminsQueryDocument = await firestore.collection("admins").doc('admins').get()
    const admins = await adminsQueryDocument.data().admin
    const token = await req.cookies.token
    const decodeValue = await admin.auth().verifyIdToken(token)
    const userId = decodeValue.uid

    const newAdmin = admins.filter(item => item.email === decodeValue.email)
    if (newAdmin[0]) {
      if (newAdmin[0].email === decodeValue.email) {
        decodeValue["roles"] = ["user", "admin"]
      }
    } else decodeValue["roles"] = ["user"]
    await firestore.collection("usersData").doc(userId).set(decodeValue)
    return res.json(decodeValue)
  } catch (e) {
    return res.json({message: 'Internal Error'})
  }
}


const fetchCategories = async (req, res) => {
  try {
    const catalog = await firestore.collection("productsCategory").doc('categories')
    const data = await catalog.get()

    if (!data.exists) {
      res.status(404).send('Categories not found')
    } else {
      res.send(data.data())
    }

  } catch (error) {
    res.status(400).send(error.message)
  }
}

const addNewAuction = async (req, res) => {
  try {
    const fetchAuctions = await firestore.collection("auctionsData").doc('auctions')
    const auctionsData = await fetchAuctions.get()
    const auctions = auctionsData.data()
    const data = req.body.data
    const productCurrentPrice = {currentPrice: data.startPrice}
    auctions['auctions'].push(data)
    await firestore.collection('auctionsData').doc('auctions').set(auctions)
    await firestore.collection('currentPrices').doc(`${data.auctionId}`).set(productCurrentPrice)
    res.send('Auction saved successfuly')
  } catch (error) {
    res.status(400).send(error.message)
  }
}

const loadAuctions = async (req, res) => {
  try {
    const catalog = await firestore.collection("auctionsData").doc('auctions')
    const data = await catalog.get()

    if (!data.exists) {
      res.status(404).send('Auctions not found')
    } else {
      res.send(data.data())
    }

  } catch (error) {
    res.status(400).send(error.message)
  }
}

const fetchProduct = async (req, res) => {
  try {
    const productId = req.params.auctionId
    const catalog = await firestore.collection("auctionsData").doc('auctions')
    const data = await catalog.get()
    const productsArray = data.data().auctions
    const productData = productsArray.filter(product => product.auctionId === productId)

    if (!productData) {
      res.status(404).send('Product not found')
    } else {
      res.send(productData)
    }

  } catch (error) {
    res.status(400).send(error.message)
  }
}

const fetchCurrentPrice = async (req, res) => {
  try {
    const productId = req.params.auctionId
    const catalog = await firestore.collection("currentPrices").doc(productId)
    const data = await catalog.get()
    const currentPrice = data.data()

    if (!currentPrice) {
      res.status(404).send('Product not found')
    } else {
      res.send(currentPrice)
    }

  } catch (error) {
    res.status(400).send(error.message)
  }
}

const modificatedCurrentPrice = async (req, res) => {
  try {
    const productId = req.params.auctionId
    const stepPrice = req.params.stepPrice
    const catalog = await firestore.collection("currentPrices").doc(productId)
    const data = await catalog.get()
    const currentPrice = data.data().currentPrice
    const newCurrentPrice = Number(currentPrice) - Number(stepPrice)
    await firestore.collection('currentPrices').doc(productId).set({currentPrice: newCurrentPrice})
    res.send('Auction saved successfuly')

  } catch (error) {
    res.status(400).send(error.message)
  }
}

const addProfile = async (req, res) => {
  try {
    const data = req.body.profile
    const email = data.email
    await firestore.collection('profilesData').doc(email).set(data)
    res.send('Profile saved successfuly')
  } catch (error) {
    res.status(400).send(error.message)
  }
}

const fetchProfile = async (req, res) => {
  try {
    const email = req.params.email
    const catalog = await firestore.collection("profilesData").doc(email)
    const data = await catalog.get()
    const profile = data.data()


    if (!profile) {
      res.status(404).send('Profile not found')
    } else {
      res.send(profile)
    }

  } catch (error) {
    res.status(400).send(error.message)
  }
}

const fetchProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category
    const catalog = await firestore.collection("auctionsData").doc('auctions')
    const data = await catalog.get()
    const allProducts = data.data()
    const products = allProducts.auctions.filter(product => product.category === category)

    if (!products) {
      res.status(404).send('Products not found')
    } else {
      res.send(products)
    }

  } catch (error) {
    res.status(400).send(error.message)
  }
}

const updateUserCash = async (req, res) => {
  try {
    const cash = req.body.cash
    const token = await req.cookies.token

    await admin
        .auth() //определяем какой юзер сделал запрос
        .verifyIdToken(token)
        .then((decodedToken) => {
          const uid = decodedToken.uid
          firestore.collection("usersData").doc(uid).get()  //получаем БД юзеров
              .then((data) => {
                const userData = data.data()

                firestore.collection("usersCash").doc(userData.email).get()  //Ищем в БД "кошелек" по емейлу
                    .then((data) => {
                      const userCashData = data.data()
                      if (userCashData === undefined) {     // если у юзера еще нет "кошелька" то создадим его
                        firestore.collection('usersCash').doc(userData.email).set({cash: cash})
                      } else {             //если "кошелек" есть то изменим его значение
                        const totalCash = userCashData.cash + cash

                        firestore.collection('usersCash').doc(userData.email).set({cash: totalCash})
                            .then((data) => {
                              res.send({cash: totalCash})

                            })
                      }
                    })
              })
        })

  } catch
      (error) {
    res.status(400).send(error.message)
  }
}


module.exports = {
  saveUser,
  fetchCategories,
  addNewAuction,
  loadAuctions,
  fetchProduct,
  fetchCurrentPrice,
  modificatedCurrentPrice,
  addProfile,
  fetchProfile,
  fetchProductsByCategory,
  updateUserCash
}


// const updatePhotos = async (req, res) => {
//   try {
//     const data = req.body.data;
//     const title = req.body.title
//     await firestore.collection('photosData').doc(title).set(data)
//     res.send('Photos saved successfuly')
//   } catch (error) {
//     res.status(400).send(error.message)
//   }
// }
//
// const fetchPhoto = async (req, res) => {
//   try {
//     const title = req.params.title
//     const catalog = await firestore.collection("photosData").doc(title)
//     const data = await catalog.get()
//
//     if (!data.exists) {
//       res.status(404).send('Photo not found')
//     } else {
//       res.send(data.data())
//     }
//
//   } catch (error) {
//     res.status(400).send(error.message)
//   }
// }
//
// const updateVideos = async (req, res) => {
//   try {
//     const data = req.body.data
//     const title = req.body.title
//     await firestore.collection('videosData').doc(title).set(data)
//     res.send('Videos saved successfuly')
//   } catch (error) {
//     res.status(400).send(error.message)
//   }
// }
//
// const fetchVideo = async (req, res) => {
//   try {
//     const title = req.params.title
//     const catalog = await firestore.collection("videosData").doc(title)
//     const data = await catalog.get()
//
//     if (!data.exists) {
//       res.status(404).send('Video not found')
//     } else {
//       res.send(data.data())
//     }
//
//   } catch (error) {
//     res.status(400).send(error.message)
//   }
// }


// const fetchReviews = async (req, res) => {
//   try {
//     const collection = await firestore.collection("reviewsData").doc('reviews')
//     const data = await collection.get()
//
//     if (!data.exists) {
//       res.status(404).send('Reviews not found')
//     } else {
//       res.send(data.data())
//     }
//
//   } catch (error) {
//     res.status(400).send(error.message)
//   }
// }
//
// const updateReviews = async (req, res) => {
//   try {
//     const data = req.body.data
//     await firestore.collection('reviewsData').doc('reviews').set(data)
//     res.send('Reviews saved successfuly')
//   } catch (error) {
//     res.status(400).send(error.message)
//   }
// }

