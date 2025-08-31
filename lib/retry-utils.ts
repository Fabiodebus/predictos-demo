export interface RetryOptions {
  attempts: number;
  backoffMs: number;
  maxBackoffMs?: number;
  exponential?: boolean;
  onRetry?: (error: unknown, attempt: number) => void;
  shouldRetry?: (error: unknown) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: unknown;
  attempts: number;
  totalTime: number;
}

export class RetryUtils {
  // Main retry function with comprehensive logging
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const opts: RetryOptions = {
      attempts: 2,
      backoffMs: 1000,
      maxBackoffMs: 10000,
      exponential: true,
      shouldRetry: (error) => {
        // Don't retry on authentication errors (401, 403)
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Don't retry on client errors (400-499) except rate limits (429)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        return true;
      },
      ...options
    };

    const startTime = Date.now();
    let lastError: unknown;

    for (let attempt = 1; attempt <= opts.attempts; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${opts.attempts}${attempt > 1 ? ' (retry)' : ''}`);
        
        const result = await fn();
        
        if (attempt > 1) {
          console.log(`✅ Success on attempt ${attempt} after ${Date.now() - startTime}ms`);
        }
        
        return result;
      } catch (error: unknown) {
        lastError = error;
        
        console.error(`❌ Attempt ${attempt} failed:`, {
          error: error instanceof Error ? error.message : String(error),
          status: error?.status || 'unknown',
          attempt,
          totalAttempts: opts.attempts
        });

        // Log request details for debugging 400s
        if (error?.status === 400) {
          console.error('🔍 400 Error Debug Info:', {
            requestBody: error?.requestBody || 'not available',
            url: error?.url || 'not available',
            headers: error?.headers || 'not available'
          });
        }

        // Check if we should retry
        if (attempt === opts.attempts || (opts.shouldRetry && !opts.shouldRetry(error))) {
          if (!opts.shouldRetry?.(error)) {
            console.error(`🚫 Not retrying due to error type: ${error?.status || 'unknown'}`);
          }
          break;
        }

        // Call onRetry callback if provided
        if (opts.onRetry) {
          opts.onRetry(error, attempt);
        }

        // Calculate backoff delay
        let delay = opts.backoffMs;
        if (opts.exponential) {
          delay = Math.min(opts.backoffMs * Math.pow(2, attempt - 1), opts.maxBackoffMs || 10000);
        }

        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const totalTime = Date.now() - startTime;
    console.error(`💥 All ${opts.attempts} attempts failed after ${totalTime}ms`);
    throw lastError;
  }

  // Specialized retry for Letta API calls
  static async withLettaRetry<T>(
    fn: () => Promise<T>,
    operation: string = 'Letta API call'
  ): Promise<T> {
    return this.withRetry(fn, {
      attempts: 2,
      backoffMs: 1000,
      onRetry: (error, attempt) => {
        console.log(`🔄 Retrying ${operation} (attempt ${attempt})`);
      },
      shouldRetry: (error) => {
        // Letta-specific retry logic
        if (error?.status === 401 || error?.status === 403) {
          console.log('🔐 Authentication error - not retrying');
          return false;
        }
        if (error?.status === 404) {
          console.log('🔍 Resource not found - not retrying');
          return false;
        }
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          console.log(`🚫 Client error (${error.status}) - not retrying`);
          return false;
        }
        return true;
      }
    });
  }

  // Specialized retry for Exa API calls
  static async withExaRetry<T>(
    fn: () => Promise<T>,
    operation: string = 'Exa API call'
  ): Promise<T> {
    return this.withRetry(fn, {
      attempts: 3, // Exa might have more transient issues
      backoffMs: 500,
      maxBackoffMs: 5000,
      onRetry: (error, attempt) => {
        console.log(`🔄 Retrying ${operation} (attempt ${attempt})`);
      },
      shouldRetry: (error) => {
        // Don't retry on auth errors or client errors
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        return true;
      }
    });
  }

  // Memory operations retry (shorter backoff)
  static async withMemoryRetry<T>(
    fn: () => Promise<T>,
    operation: string = 'Memory operation'
  ): Promise<T> {
    return this.withRetry(fn, {
      attempts: 2,
      backoffMs: 500,
      onRetry: (error, attempt) => {
        console.log(`🧠 Retrying ${operation} (attempt ${attempt})`);
      }
    });
  }

  // Simple retry with minimal logging
  static async retry<T>(
    fn: () => Promise<T>,
    attempts: number = 2,
    backoffMs: number = 1000
  ): Promise<T> {
    return this.withRetry(fn, {
      attempts,
      backoffMs,
      onRetry: () => {} // No logging
    });
  }

  // Retry with timeout
  static async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    operation: string = 'Operation'
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }

  // Retry with timeout combination
  static async withRetryAndTimeout<T>(
    fn: () => Promise<T>,
    retryOptions: Partial<RetryOptions> = {},
    timeoutMs: number = 30000,
    operation: string = 'Operation'
  ): Promise<T> {
    return this.withRetry(
      () => this.withTimeout(fn, timeoutMs, operation),
      retryOptions
    );
  }

  // Batch retry for multiple operations
  static async retryBatch<T>(
    operations: Array<() => Promise<T>>,
    options: Partial<RetryOptions> = {}
  ): Promise<Array<RetryResult<T>>> {
    const results: Array<RetryResult<T>> = [];

    for (const [index, operation] of operations.entries()) {
      const startTime = Date.now();
      console.log(`🚀 Starting batch operation ${index + 1}/${operations.length}`);

      try {
        const result = await this.withRetry(operation, options);
        results.push({
          success: true,
          result,
          attempts: 1, // Simplified for batch
          totalTime: Date.now() - startTime
        });
      } catch (error) {
        results.push({
          success: false,
          error,
          attempts: options.attempts || 2,
          totalTime: Date.now() - startTime
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    console.log(`📊 Batch complete: ${successful}/${results.length} operations succeeded`);

    return results;
  }
}