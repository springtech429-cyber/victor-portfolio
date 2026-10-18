#!/usr/bin/env bash
# Pushes this project to your EXISTING GitHub repo (springtech429-cyber/victor-portfolio).
# Run from the project folder:   bash push-to-github.sh
# On Windows, run it in "Git Bash" (installed with Git for Windows).
#
# If the repo already has commits, they are kept in its history. This project's files are added
# on top as one new commit, so the push is a normal fast-forward and nothing is force-pushed.
set -euo pipefail

GITHUB_USER="springtech429-cyber"
REPO="victor-portfolio"
REMOTE_URL="${REMOTE_URL:-https://github.com/${GITHUB_USER}/${REPO}.git}"

cd "$(dirname "$0")"

command -v git >/dev/null 2>&1 || { echo "Git is not installed. Get it from https://git-scm.com/downloads"; exit 1; }

# A commit needs a name and email. The email is public on public repos, so GitHub's
# no-reply address is a good choice (GitHub > Settings > Emails shows yours).
if [ -z "$(git config user.name || true)" ] || [ -z "$(git config user.email || true)" ]; then
  echo "Set your Git identity first, then run this script again:"
  echo '  git config --global user.name  "Victor Mwewa"'
  echo '  git config --global user.email "your-id+springtech429-cyber@users.noreply.github.com"'
  exit 1
fi

[ -d .git ] || git init -q

# Safety: never publish your keys.
if [ -f .env ] && ! git check-ignore -q .env; then
  echo ".env is not ignored by git, so your keys could be published. Add .env to .gitignore first."
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then git remote set-url origin "$REMOTE_URL"; else git remote add origin "$REMOTE_URL"; fi

echo "Checking ${REMOTE_URL} ..."
if ! INFO=$(git ls-remote --symref origin HEAD 2>&1); then
  echo "$INFO"
  echo
  echo "Could not access the repo."
  case "$INFO" in
    *403*|*"Write access"*|*"denied"*|*"Authentication failed"*)
      echo "GitHub rejected the login Git is using. The usual causes:"
      echo "  1. Git saved a login for a different GitHub account. Clear it, then run this script again."
      echo "     In Git Bash:   printf 'protocol=https\nhost=github.com\n\n' | git credential reject"
      echo "     On Windows you can also remove it in: Credential Manager > Windows Credentials > git:https://github.com"
      echo "     When asked to sign in again, use the springtech429-cyber account."
      echo "  2. You are using a token without write permission. Use a classic token with the 'repo'"
      echo "     scope, or a fine-grained token with Contents: Read and write for victor-portfolio."
      ;;
    *"not found"*|*"404"*)
      echo "GitHub says the repo was not found. Check the name is exactly ${GITHUB_USER}/${REPO}."
      echo "(For a private repo, GitHub also shows 'not found' when you are signed in as the wrong account.)"
      ;;
    *) echo "Check your internet connection and the repo name." ;;
  esac
  exit 1
fi
REMOTE_BRANCH=$(printf '%s\n' "$INFO" | sed -n 's#^ref: refs/heads/\([^[:space:]]*\)[[:space:]]*HEAD$#\1#p' | head -1)
BRANCH="${REMOTE_BRANCH:-main}"

# Repo already has commits and this folder has none yet: build on top of the existing history.
if [ -n "$REMOTE_BRANCH" ] && ! git rev-parse -q --verify HEAD >/dev/null 2>&1; then
  echo
  echo "The repo already has code on '${BRANCH}'. This project will replace its current files."
  echo "The old versions stay in the repo's history, so nothing is lost."
  if [ "${SKIP_PROMPT:-}" != "1" ]; then
    read -r -p "Continue? [y/N] " answer
    [ "$answer" = "y" ] || [ "$answer" = "Y" ] || { echo "Cancelled. Nothing was changed."; exit 0; }
  fi
  git fetch -q origin "$BRANCH"
  git symbolic-ref HEAD "refs/heads/${BRANCH}"
  git update-ref "refs/heads/${BRANCH}" "origin/${BRANCH}"
else
  git checkout -q -B "$BRANCH" 2>/dev/null || git symbolic-ref HEAD "refs/heads/${BRANCH}"
fi

git add -A
if git diff --cached --quiet; then
  echo "Nothing new to commit."
else
  git commit -q -m "Portfolio site with admin dashboard"
  git --no-pager diff --stat HEAD~1 HEAD 2>/dev/null | tail -1 || true
fi

# GitHub no longer accepts account passwords here. When asked for a password, paste a
# Personal Access Token (GitHub > Settings > Developer settings > Tokens, "repo" scope),
# or sign in through the browser window Git Credential Manager opens on Windows.
git push -u origin "$BRANCH"
echo "Done: https://github.com/${GITHUB_USER}/${REPO}"
