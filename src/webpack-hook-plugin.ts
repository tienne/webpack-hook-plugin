import {spawn, exec, ChildProcess, ExecException} from 'child_process';
import * as os from 'os';
import {Compiler} from 'webpack';

interface HookPluginOptions {
  onBuildStart?: string[];
  onBuildEnd?: string[],
  onBuildExit?: string[],
  onCompile?: string[],
  dev?: boolean,
  safe?: boolean
}

const defaultOptions: HookPluginOptions = {
  onBuildStart: [],
  onBuildEnd: [],
  onBuildExit: [],
  onCompile: [],
  dev: true,
  safe: false
};

export default class WebpackHookPlugin {
  options: HookPluginOptions;

  constructor(options: HookPluginOptions) {
    this.options = this.mergeOptions(options, defaultOptions);
  }

  puts(error: ExecException|null) {
    if (error) {
      throw error;
    }
  }

  spreadStdoutAndStdErr(proc: ChildProcess) {
    if (proc.stderr) {
      proc.stderr.pipe(process.stdout);
    }

    if (proc.stdout) {
      proc.stdout.pipe(process.stdout);
    }
  }

  serializeScript(script: string) {
    const [command, ...args] = script.split(' ');
    return {command, args};
  }

  handleScript(script: string) {
    if (os.platform() === 'win32' || this.options.safe) {
      this.spreadStdoutAndStdErr(exec(script, this.puts));
    } else {
      const {command, args} = this.serializeScript(script);
      const proc = spawn(command, args, {stdio: 'inherit'});
      proc.on('close', this.puts);
    }
  }

  mergeOptions(options: HookPluginOptions, defaults: HookPluginOptions) {
    for (const key in defaults) {
      if (options.hasOwnProperty(key)) {
        (defaults as any)[key] = (options as any)[key];
      }
    }
    return defaults;
  }

  apply(compiler: Compiler) {

    compiler.hooks.compilation.tap('WebpackHookPlugin', (compilation) => {
      if (this.options.onBuildStart && this.options.onBuildStart.length) {
        console.log('Executing pre-build scripts');
        for (let ii = 0; ii < this.options.onBuildStart.length; ii += 1) {
          this.handleScript(this.options.onBuildStart[ii]);
        }
        if (this.options.dev) {
          this.options.onBuildStart = [];
        }
      }
    });

    compiler.hooks.watchRun.tap('WebpackHookPlugin', () => {
      if (this.options.onCompile && this.options.onCompile.length) {
        console.log('Executing compile scripts');
        for (let ii = 0; ii < this.options.onCompile.length; ii += 1) {
          this.handleScript(this.options.onCompile[ii]);
        }
      }
    });

    compiler.hooks.afterEmit.tapAsync('WebpackHookPlugin', (compilation, callback) => {
      if (this.options.onBuildEnd && this.options.onBuildEnd.length) {
        console.log('Executing post-build scripts');
        for (let ii = 0; ii < this.options.onBuildEnd.length; ii += 1) {
          this.handleScript(this.options.onBuildEnd[ii]);
        }
        if (this.options.dev) {
          this.options.onBuildEnd = [];
        }
      }
      callback();
    });

    compiler.hooks.done.tap('WebpackHookPlugin', () => {
      if (this.options.onBuildExit && this.options.onBuildExit.length) {
        console.log('Executing additional scripts before exit');
        for (let ii = 0; ii < this.options.onBuildExit.length; ii += 1) {
          this.handleScript(this.options.onBuildExit[ii]);
        }
      }
    });
  }
}
