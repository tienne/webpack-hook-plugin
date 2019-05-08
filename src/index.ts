import {spawn, exec, ChildProcess} from 'child_process';
import * as os from 'os';

interface HookPluginOptions {
  onBuildStart: string[];
  onBuildEnd: string[],
  onBuildExit: string[],
  onCompile: string[],
  dev: boolean,
  safe: boolean
}

const defaultOptions: HookPluginOptions = {
  onBuildStart: [],
  onBuildEnd: [],
  onBuildExit: [],
  onCompile: [],
  dev: true,
  safe: false
};

class WebpackHookPlugin {
  options: HookPluginOptions;

  constructor(options: HookPluginOptions) {
    this.options = this.mergeOptions(options, defaultOptions);
  }

  puts(error) {
    if (error) {
      throw error;
    }
  }

  spreadStdoutAndStdErr(proc: ChildProcess) {
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stdout);
  }

  serializeScript(script) {
    if (typeof script === 'string') {
      const [command, ...args] = script.split(' ');
      return {command, args};
    }
    const {command, args} = script;
    return {command, args};
  }

  handleScript(script) {
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
        defaults[key] = options[key];
      }
    }
    return defaults;
  }

  apply(compiler) {

    compiler.hooks.compilation.tap('WebpackHookPlugin', (compilation) => {
      if (this.options.onBuildStart.length) {
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
      if (this.options.onCompile.length) {
        console.log('Executing compile scripts');
        for (let ii = 0; ii < this.options.onCompile.length; ii += 1) {
          this.handleScript(this.options.onCompile[ii]);
        }
      }
    });

    compiler.hooks.afterEmit.tapAsync('WebpackHookPlugin', (compilation, callback) => {
      if (this.options.onBuildEnd.length) {
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
      if (this.options.onBuildExit.length) {
        console.log('Executing additional scripts before exit');
        for (let ii = 0; ii < this.options.onBuildExit.length; ii += 1) {
          this.handleScript(this.options.onBuildExit[ii]);
        }
      }
    });
  }
}

export = WebpackHookPlugin;
