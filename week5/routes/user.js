const express = require('express')
const bcrypt = require('bcrypt')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('User')
const { isUndefined, isNotValidString,isValidUUID,isValidPassword } = require('../utils/validUtils')

//saltRounds：指定「鹽（salt）」的計算輪數，用來增加哈希運算的強度，提高破解難度
const saltRounds = 10



// 新增使用者
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    // 驗證必填欄位
    if (isUndefined(name) || isNotValidString(name) || isUndefined(email) || isNotValidString(email) || isUndefined(password) || isNotValidString(password)) {
      logger.warn('欄位未填寫正確')
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }
    if (!isValidPassword(password)) {
      logger.warn('建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
      res.status(400).json({
        status: 'failed',
        message: '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
      })
      return
    }

    const userRepository = dataSource.getRepository('User')
    // 檢查 email 是否已存在
    const existingUser = await userRepository.findOne({
      where: { email }
    })

    if (existingUser) {
      logger.warn('建立使用者錯誤: Email 已被使用')
      res.status(409).json({
        status: 'failed',
        message: 'Email 已被使用'
      })
      return
    }

    // 建立新使用者
    const hashPassword = await bcrypt.hash(password, saltRounds)
    const newUser = userRepository.create({
      name,
      email,
      role: 'USER',
      password: hashPassword
    })

    const savedUser = await userRepository.save(newUser)
    logger.info('新建立的使用者ID:', savedUser.id)

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: savedUser.id,
          name: savedUser.name
        }
      }
    })
  } catch (error) {
    logger.error('建立使用者錯誤:', error)
    next(error)
  }
})

module.exports = router