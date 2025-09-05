/**
 * Health Monitoring Service
 * Comprehensive health checks for all system components
 */

import { env, config } from '@/lib/config/environment';
import { checkDatabaseHealth } from '@/lib/config/database';
import { checkGmailServicesHealth } from '@/lib/services/gmail';
import { logger } from '@/lib/logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  services: {
    database: ServiceHealth;
    environment: ServiceHealth;
    gmail?: ServiceHealth;
  };
  version: string;
  environment: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'not_configured';
  latency?: number;
  error?: string;
  details?: Record<string, any>;
  lastChecked: string;
}

class HealthMonitor {
  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    const log = logger.authOperation('health_check');

    try {
      log.info('Performing comprehensive health check');

      // Check all services
      const [databaseHealth, environmentHealth, gmailHealth] = await Promise.all([
        this.checkDatabase(),
        this.checkEnvironment(),
        this.checkGmailServices(),
      ]);

      // Determine overall status
      const services: any = { database: databaseHealth, environment: environmentHealth };
      if (gmailHealth) {
        services.gmail = gmailHealth;
      }

      const serviceStatuses = Object.values(services).map((s: any) => s.status);
      const overallStatus = this.determineOverallStatus(serviceStatuses);

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services,
        version: config.app.version,
        environment: config.app.environment,
      };

      const responseTime = Date.now() - startTime;
      log.info('Health check completed', {
        overallStatus,
        responseTime: `${responseTime}ms`,
        services: Object.fromEntries(
          Object.entries(services).map(([name, health]: [string, any]) => [name, health.status])
        ),
      });

      return healthStatus;

    } catch (error: any) {
      log.error('Health check failed', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services: {
          database: { status: 'unhealthy', error: 'Health check failed', lastChecked: new Date().toISOString() },
          environment: { status: 'unhealthy', error: 'Health check failed', lastChecked: new Date().toISOString() },
        },
        version: config.app.version,
        environment: config.app.environment,
      };
    }
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const result = await checkDatabaseHealth();
      const latency = Date.now() - startTime;

      if (result.status === 'healthy') {
        return {
          status: 'healthy',
          latency,
          details: { message: 'Database connection successful' },
          lastChecked: new Date().toISOString(),
        };
      } else {
        return {
          status: 'unhealthy',
          latency,
          error: result.error,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error: any) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkEnvironment(): Promise<ServiceHealth> {
    try {
      const issues: string[] = [];

      // Check required environment variables
      if (!config.supabase.url) issues.push('NEXT_PUBLIC_SUPABASE_URL missing');
      if (!config.supabase.anonKey) issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY missing');

      // Check Gmail configuration (optional for Phase 1)
      const hasGmailConfig = env.hasGmailConfig();
      if (!hasGmailConfig) {
        issues.push('Gmail configuration missing (optional for Phase 1)');
      }

      if (issues.length === 0 || (issues.length === 1 && issues[0].includes('optional'))) {
        return {
          status: 'healthy',
          details: {
            message: 'Environment configuration valid',
            gmailConfigured: hasGmailConfig,
          },
          lastChecked: new Date().toISOString(),
        };
      } else {
        return {
          status: 'unhealthy',
          error: issues.join(', '),
          details: { issues },
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error: any) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkGmailServices(): Promise<ServiceHealth | undefined> {
    if (!env.hasGmailConfig()) {
      console.log('ℹ️ GMAIL CONFIG: Gmail configuration not available - this is optional for Phase 1');
      return {
        status: 'not_configured',
        details: { message: 'Gmail configuration not available' },
        lastChecked: new Date().toISOString(),
      };
    }

    // Temporarily skip Gmail health check to prevent server crashes
    console.log('⏭️ GMAIL HEALTH CHECK: Temporarily skipped to prevent server instability');
    return {
      status: 'degraded',
      details: { message: 'Gmail health check temporarily disabled' },
      lastChecked: new Date().toISOString(),
    };

    /*
    try {
      console.log('🔄 GMAIL CONNECTION TEST: Starting Gmail services health check with 30-second timeout...');

      // Reduce timeout to 30 seconds to prevent server hangs
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gmail connection test timed out after 30 seconds')), 30000);
      });

      const gmailHealthPromise = checkGmailServicesHealth();
      const gmailHealth = await Promise.race([gmailHealthPromise, timeoutPromise]) as any;

      if (gmailHealth.status === 'healthy') {
        console.log('✅ GMAIL CONNECTION SUCCESS: Gmail services are operational and ready for use', {
          details: gmailHealth.details,
          timestamp: new Date().toISOString()
        });
        return {
          status: 'healthy',
          details: gmailHealth.details,
          lastChecked: new Date().toISOString(),
        };
      } else {
        console.log('❌ GMAIL CONNECTION ISSUE: Gmail services not operational', {
          status: gmailHealth.status,
          message: gmailHealth.message,
          timestamp: new Date().toISOString()
        });
        return {
          status: 'unhealthy',
          error: gmailHealth.message,
          details: gmailHealth,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error: any) {
      console.log('❌ GMAIL CONNECTION ERROR: Failed to check Gmail services', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
    */
  }

  private determineOverallStatus(serviceStatuses: string[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (serviceStatuses.includes('unhealthy')) {
      return 'unhealthy';
    }
    if (serviceStatuses.includes('degraded')) {
      return 'degraded';
    }
    return 'healthy';
  }

  async quickHealthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime: number }> {
    const startTime = Date.now();
    try {
      await checkDatabaseHealth();
      return { status: 'healthy', responseTime: Date.now() - startTime };
    } catch {
      return { status: 'unhealthy', responseTime: Date.now() - startTime };
    }
  }
}

// Create singleton instance
export const healthMonitor = new HealthMonitor();

// Export convenience functions
export const checkHealth = () => healthMonitor.checkHealth();
export const quickHealthCheck = () => healthMonitor.quickHealthCheck();