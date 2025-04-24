import { NextRequest, NextResponse } from 'next/server';
import os from 'os';

// Simple health check endpoint for Elastic Beanstalk
export async function GET(request: NextRequest) {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const freemem = os.freemem();
  const totalmem = os.totalmem();

  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      free: `${Math.round(freemem / 1024 / 1024)} MB`,
      total: `${Math.round(totalmem / 1024 / 1024)} MB`,
      percentage: `${Math.round(((totalmem - freemem) / totalmem) * 100)}%`
    },
    version: process.env.npm_package_version || 'unknown'
  };

  return NextResponse.json(healthData);
} 