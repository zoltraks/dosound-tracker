#!/bin/bash

set -e

current_branch=$(git branch --show-current)
trap "git checkout $current_branch" EXIT

echo "Fetching from all remotes..."
git fetch --all

echo "Creating local tracking branches for all remote branches..."
for remote in $(git remote); do
    for branch in $(git ls-remote --heads $remote | awk '{print $2}' | sed 's|refs/heads/||'); do
        if ! git show-ref --verify --quiet refs/heads/$branch; then
            echo "Creating local branch $branch tracking $remote/$branch"
            git branch --track $branch $remote/$branch
        fi
    done
done

echo "Pulling all local branches..."
for branch in $(git branch --format='%(refname:short)'); do
    if git config --get branch.$branch.remote > /dev/null 2>&1; then
        echo "Pulling $branch"
        git checkout $branch
        git pull
    fi
done

echo "Pushing all branches to all remotes..."
for remote in $(git remote); do
    echo "Pushing to $remote..."
    git push --all --force-with-lease $remote
done

git checkout $current_branch

echo "Synchronization complete."
