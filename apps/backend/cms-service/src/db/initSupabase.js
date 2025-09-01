'use strict'

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

class Database {

    constructor() {
        this.connect();
    }

    connect() {
        dotenv.config({ path: path.resolve(__dirname, '../../.env') })
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in .env file')
        }

        this.client = createClient(supabaseUrl, supabaseKey)
        console.log('Connected Supabase Success')
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database()
        }
        return Database.instance
    }
}

const instanceSupabase = Database.getInstance().client
module.exports = instanceSupabase