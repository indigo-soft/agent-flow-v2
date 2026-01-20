# Встановити commit template

git config --global commit.template ~/.gitmessage

# Скопіювати .gitmessage у home directory (якщо нема)

cp .gitmessage ~/.gitmessage

# Налаштувати автоматичне rebase при pull

git config --global pull.rebase true

# Налаштувати default branch name

git config --global init.defaultBranch main

# Налаштувати кольоровий вивід

git config --global color.ui auto

# Налаштувати editor (уставте свій улюблений)

git config --global core.editor "code --wait"  # VS Code

# або

git config --global core.editor "vim"
