import simpleGit from 'simple-git'

export function cloneRepository(
    repositoryUrl: string,
    localPath: string,
    branch: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        simpleGit()
            .clone(repositoryUrl, localPath, ['--branch', branch, '--depth', '1'])
            .then(() => resolve())
            .catch((error) => reject(error))
    })
}

export function checkIfRepositoryExists(
    repositoryUrl: string
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        simpleGit()
            .checkIsRepo()
            .then((isRepo) => resolve(isRepo))
            .catch((error) => {
                if (error.message.includes('not a git repository')) {
                    resolve(false)
                } else {
                    reject(error)
                }
            })
    })
}