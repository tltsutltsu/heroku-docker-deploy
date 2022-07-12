import * as core from '@actions/core';
import { runCommand } from '../utils';

export const pushDockerContainer = async ({
  herokuApiKey,
  herokuAppName,
  cwd,
  processTypes,
}: {
  herokuAppName: string;
  herokuApiKey: string;
  processTypes: string[];
  cwd: string;
}): Promise<boolean> => {
  try {
    core.startGroup('Pushing container to heroku registry...');

    console.log('Logining to heroku container registry...');

    await runCommand('heroku container:login', {
      env: { HEROKU_API_KEY: herokuApiKey },
      options: { cwd },
    });

    console.log('Creating app in case if it does not exists');

    try {
      await runCommand(`heroku create ${herokuAppName}`, {
        env: { HEROKU_API_KEY: herokuApiKey },
        options: { cwd },
      });
    } catch (_) {}

    const tags = processTypes.map((processType) => `registry.heroku.com/${herokuAppName}/${processType}`);

    for (const tag of tags) {
      await runCommand(`docker push ${tag}`, {
        env: { HEROKU_API_KEY: herokuApiKey },
        options: { cwd },
      });
      console.log(`${tag} container pushed.`);
    }
    core.endGroup();
    return true;
  } catch (err) {
    core.endGroup();
    if (err instanceof Error) {
      core.setFailed(`Pushing docker container failed.\nError: ${err.message}`);
    } else {
      core.setFailed(`Pushing docker container failed.\nError: ${err}`);
    }
    return false;
  }
};
