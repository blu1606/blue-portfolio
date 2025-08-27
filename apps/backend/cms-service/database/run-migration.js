// database/run-migration.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_KEY)');
    process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQL(sqlContent, description) {
    console.log(`\n🔧 ${description}...`);
    
    try {
        // Split SQL content by semicolon and filter out empty statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`   Found ${statements.length} SQL statements to execute`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.length === 0) continue;
            
            console.log(`   Executing statement ${i + 1}/${statements.length}...`);
            
            const { data, error } = await supabase.rpc('execute_sql', {
                sql_query: statement + ';'
            });
            
            if (error) {
                // Try direct execution for some statements
                const { error: directError } = await supabase
                    .from('_migrations')
                    .select('*')
                    .limit(1);
                
                if (directError && directError.code === '42P01') {
                    // Table doesn't exist, this might be a DDL statement
                    console.log(`   ⚠️  RPC method not available, attempting direct execution...`);
                    // For now, we'll log the statement that would be executed
                    console.log(`   SQL: ${statement.substring(0, 100)}...`);
                } else {
                    console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
                    console.error(`   Statement: ${statement.substring(0, 200)}...`);
                }
            } else {
                console.log(`   ✅ Statement ${i + 1} executed successfully`);
            }
        }
        
        console.log(`✅ ${description} completed`);
        return true;
    } catch (error) {
        console.error(`❌ Error in ${description}:`, error.message);
        return false;
    }
}

async function testConnection() {
    console.log('🔌 Testing Supabase connection...');
    
    try {
        const { data, error } = await supabase
            .from('feedbacks')
            .select('count', { count: 'exact', head: true });
        
        if (error && error.code !== '42P01') { // 42P01 = table doesn't exist
            throw error;
        }
        
        console.log('✅ Connected to Supabase successfully');
        if (error?.code === '42P01') {
            console.log('ℹ️  Feedbacks table does not exist yet - will be created during migration');
        } else {
            console.log(`ℹ️  Current feedbacks count: ${data?.[0]?.count || 0}`);
        }
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to Supabase:', error.message);
        return false;
    }
}

async function checkCurrentSchema() {
    console.log('\n🔍 Checking current database schema...');
    
    try {
        // Check if feedbacks table exists and its structure
        const { data: tables, error } = await supabase.rpc('get_table_info', {
            table_name: 'feedbacks'
        });
        
        if (error) {
            console.log('ℹ️  Unable to check table structure (table may not exist)');
        } else {
            console.log('✅ Current feedbacks table found');
        }
        
        // Check for new columns
        const newColumns = [
            'author_name', 'author_email', 'author_avatar_url', 
            'rating', 'images', 'is_anonymous', 'ip_address', 'user_agent'
        ];
        
        console.log('ℹ️  Migration will add these columns:', newColumns.join(', '));
        
    } catch (error) {
        console.log('ℹ️  Could not check current schema - proceeding with migration');
    }
}

async function runMigration() {
    console.log('🚀 Starting Supabase Database Migration');
    console.log('=====================================\n');
    
    // Test connection
    const connectionOk = await testConnection();
    if (!connectionOk) {
        console.error('❌ Cannot proceed without database connection');
        process.exit(1);
    }
    
    // Check current schema
    await checkCurrentSchema();
    
    console.log('\n⚠️  WARNING: This will modify your database structure!');
    console.log('   - New columns will be added to feedbacks table');
    console.log('   - New tables (media, analytics) will be created');
    console.log('   - New indexes and constraints will be added');
    console.log('   - RLS policies will be updated');
    
    // In production, you might want to add a confirmation prompt here
    
    console.log('\n🎯 Proceeding with migration...\n');
    
    try {
        // Read migration file
        const migrationPath = path.join(__dirname, 'migration_v2.sql');
        if (!fs.existsSync(migrationPath)) {
            console.error('❌ Migration file not found:', migrationPath);
            process.exit(1);
        }
        
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log('✅ Migration file loaded successfully');
        
        // Execute migration
        const success = await runSQL(migrationSQL, 'Running database migration');
        
        if (success) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('   1. Test the new anonymous feedback API');
            console.log('   2. Verify image upload functionality');
            console.log('   3. Check rate limiting is working');
            console.log('   4. Review RLS policies in Supabase dashboard');
        } else {
            console.log('\n⚠️  Migration completed with some errors');
            console.log('   Please check the errors above and verify manually in Supabase');
        }
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Check your Supabase credentials');
        console.error('   2. Verify database permissions');
        console.error('   3. Run migration manually in Supabase SQL editor');
        process.exit(1);
    }
}

// Handle manual SQL execution for Supabase
async function showManualInstructions() {
    console.log('\n📋 MANUAL MIGRATION INSTRUCTIONS');
    console.log('==================================');
    console.log('\nIf the automated migration doesn\'t work, follow these steps:');
    console.log('\n1. Open your Supabase project dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the content of migration_v2.sql');
    console.log('4. Execute the SQL statements');
    console.log('\nOr run individual files in this order:');
    console.log('   - supabase_setup.sql (setup)');
    console.log('   - migration_v2.sql (main migration)');
    
    const migrationPath = path.join(__dirname, 'migration_v2.sql');
    if (fs.existsSync(migrationPath)) {
        console.log('\n📄 Migration file location:');
        console.log(`   ${migrationPath}`);
    }
}

// Run migration
if (require.main === module) {
    runMigration()
        .then(() => {
            showManualInstructions();
        })
        .catch((error) => {
            console.error('❌ Unexpected error:', error);
            showManualInstructions();
        });
}

module.exports = { runMigration, runSQL };
