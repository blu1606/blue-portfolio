// src/utils/queryOptimization.js
/**
 * Database query optimization utilities
 */

class QueryOptimizer {
  constructor() {
    this.queryMetrics = new Map();
    this.slowQueries = [];
  }

  // Track query performance
  trackQuery(query, duration, resultCount = 0) {
    const queryHash = this.hashQuery(query);
    const metric = this.queryMetrics.get(queryHash) || {
      query: query.substring(0, 100),
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      minDuration: Infinity
    };

    metric.count++;
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.count;
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.minDuration = Math.min(metric.minDuration, duration);

    this.queryMetrics.set(queryHash, metric);

    // Track slow queries
    if (duration > 1000) { // 1 second threshold
      this.slowQueries.push({
        query: query.substring(0, 200),
        duration,
        timestamp: new Date(),
        resultCount
      });

      // Keep only last 100 slow queries
      if (this.slowQueries.length > 100) {
        this.slowQueries = this.slowQueries.slice(-100);
      }
    }
  }

  // Generate optimized pagination queries
  optimizePagination(baseQuery, limit, offset, options = {}) {
    let optimizedQuery = baseQuery;

    // Use cursor-based pagination for better performance on large datasets
    if (options.cursor && options.cursorField) {
      optimizedQuery = optimizedQuery.replace(
        /ORDER BY/i,
        `WHERE ${options.cursorField} > '${options.cursor}' ORDER BY`
      );
      optimizedQuery += ` LIMIT ${limit}`;
    } else {
      // Traditional offset pagination with optimization
      if (offset > 10000) {
        console.warn(`Large offset detected (${offset}). Consider cursor-based pagination.`);
      }
      optimizedQuery += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    return optimizedQuery;
  }

  // Optimize search queries
  optimizeSearchQuery(searchTerm, fields, options = {}) {
    const { 
      fuzzySearch = true, 
      boostFields = {}, 
      filters = {},
      limit = 20 
    } = options;

    // Basic text search optimization
    if (searchTerm.length < 3) {
      // For short terms, use exact match
      return this.buildExactSearchQuery(searchTerm, fields, filters, limit);
    }

    // For longer terms, use full-text search
    return this.buildFullTextSearchQuery(searchTerm, fields, boostFields, filters, limit);
  }

  // Build efficient JOIN queries
  optimizeJoinQuery(baseTable, joins, conditions = [], options = {}) {
    let query = `SELECT `;
    
    // Select only necessary fields
    const selectFields = options.selectFields || [`${baseTable}.*`];
    query += selectFields.join(', ');
    
    query += ` FROM ${baseTable}`;

    // Optimize JOIN order (smaller tables first)
    const optimizedJoins = this.optimizeJoinOrder(joins);
    
    for (const join of optimizedJoins) {
      query += ` ${join.type || 'LEFT'} JOIN ${join.table} ON ${join.condition}`;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    return query;
  }

  // Batch operations for better performance
  createBatchInsert(table, rows, batchSize = 1000) {
    const batches = [];
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const values = batch.map(row => {
        const valueStr = Object.values(row)
          .map(val => typeof val === 'string' ? `'${val}'` : val)
          .join(', ');
        return `(${valueStr})`;
      }).join(', ');

      const columns = Object.keys(batch[0]).join(', ');
      batches.push(`INSERT INTO ${table} (${columns}) VALUES ${values}`);
    }

    return batches;
  }

  // Index usage recommendations
  analyzeQueryForIndexes(query) {
    const recommendations = [];
    
    // Check for WHERE clauses without indexes
    const whereMatch = query.match(/WHERE\s+(\w+)\s*=/gi);
    if (whereMatch) {
      whereMatch.forEach(match => {
        const field = match.split(/\s+/)[1];
        recommendations.push({
          type: 'index',
          field,
          reason: 'WHERE clause without index may cause full table scan'
        });
      });
    }

    // Check for ORDER BY without indexes
    const orderMatch = query.match(/ORDER BY\s+(\w+)/gi);
    if (orderMatch) {
      orderMatch.forEach(match => {
        const field = match.split(/\s+/)[2];
        recommendations.push({
          type: 'index',
          field,
          reason: 'ORDER BY without index may cause filesort'
        });
      });
    }

    // Check for JOINs without proper indexes
    const joinMatch = query.match(/JOIN\s+(\w+)\s+ON\s+(\w+\.\w+)\s*=\s*(\w+\.\w+)/gi);
    if (joinMatch) {
      joinMatch.forEach(match => {
        recommendations.push({
          type: 'join_index',
          reason: 'JOIN conditions should have indexes on both tables'
        });
      });
    }

    return recommendations;
  }

  // Query plan analysis (would integrate with actual database)
  analyzeQueryPlan(query) {
    // This would use EXPLAIN PLAN in actual implementation
    return {
      estimatedCost: this.estimateQueryCost(query),
      suggestedOptimizations: this.analyzeQueryForIndexes(query),
      complexity: this.calculateQueryComplexity(query)
    };
  }

  // Helper methods
  hashQuery(query) {
    // Simple hash function for query identification
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  buildExactSearchQuery(term, fields, filters, limit) {
    const conditions = fields.map(field => `${field} ILIKE '%${term}%'`);
    let query = `SELECT * FROM posts WHERE (${conditions.join(' OR ')})`;
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      query += ` AND ${key} = '${value}'`;
    });
    
    query += ` LIMIT ${limit}`;
    return query;
  }

  buildFullTextSearchQuery(term, fields, boostFields, filters, limit) {
    // Would use database-specific full-text search
    const searchVector = fields.map(field => {
      const boost = boostFields[field] || 1;
      return `setweight(to_tsvector('english', ${field}), '${boost > 1 ? 'A' : 'B'}')`;
    }).join(' || ');

    let query = `
      SELECT *, ts_rank_cd(${searchVector}, plainto_tsquery('english', '${term}')) as rank
      FROM posts 
      WHERE ${searchVector} @@ plainto_tsquery('english', '${term}')
    `;

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      query += ` AND ${key} = '${value}'`;
    });

    query += ` ORDER BY rank DESC LIMIT ${limit}`;
    return query;
  }

  optimizeJoinOrder(joins) {
    // Simple optimization: smaller tables first
    return joins.sort((a, b) => {
      const aSize = a.estimatedRows || 1000;
      const bSize = b.estimatedRows || 1000;
      return aSize - bSize;
    });
  }

  estimateQueryCost(query) {
    // Simple cost estimation based on query complexity
    let cost = 1;
    
    const joinCount = (query.match(/JOIN/gi) || []).length;
    const whereCount = (query.match(/WHERE/gi) || []).length;
    const orderCount = (query.match(/ORDER BY/gi) || []).length;
    const subqueryCount = (query.match(/\(/g) || []).length;
    
    cost += joinCount * 2;
    cost += whereCount * 0.5;
    cost += orderCount * 1.5;
    cost += subqueryCount * 3;
    
    return cost;
  }

  calculateQueryComplexity(query) {
    const factors = {
      tables: (query.match(/FROM|JOIN/gi) || []).length,
      conditions: (query.match(/WHERE|AND|OR/gi) || []).length,
      aggregations: (query.match(/COUNT|SUM|AVG|MAX|MIN/gi) || []).length,
      subqueries: (query.match(/\(/g) || []).length
    };

    const complexity = factors.tables + factors.conditions + factors.aggregations * 2 + factors.subqueries * 3;
    
    if (complexity > 20) return 'high';
    if (complexity > 10) return 'medium';
    return 'low';
  }

  // Get performance statistics
  getStats() {
    const stats = {
      totalQueries: 0,
      avgDuration: 0,
      slowQueries: this.slowQueries.length,
      topSlowQueries: []
    };

    for (const metric of this.queryMetrics.values()) {
      stats.totalQueries += metric.count;
      stats.avgDuration += metric.avgDuration * metric.count;
    }

    if (stats.totalQueries > 0) {
      stats.avgDuration = stats.avgDuration / stats.totalQueries;
    }

    // Get top 5 slowest queries
    const sortedMetrics = Array.from(this.queryMetrics.values())
      .sort((a, b) => b.maxDuration - a.maxDuration)
      .slice(0, 5);

    stats.topSlowQueries = sortedMetrics.map(metric => ({
      query: metric.query,
      maxDuration: metric.maxDuration,
      avgDuration: metric.avgDuration,
      count: metric.count
    }));

    return stats;
  }
}

module.exports = { QueryOptimizer };
