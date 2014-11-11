#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/../"

###
declare RANKS=10

echo -e "\n\e[1mProject statistics - top $RANKS\e[0m\n"

declare RANKLIST=( "Rank" $(seq 1 $RANKS) )

IFS=$'\n'

declare -a LOC=( "$(
	echo -e "Lines of code"
	(cd src && find . -name '*.js' -exec wc -l {} \;) | sort -n | tail -n $((RANKS+1)) | tac | tail -n +2 | sed -E 's/^\s+//g; s/\s+/\t/g' | column -t -s"	"
)" )

declare -a CHARS=( "$(
	echo -e "Total characters"
	(cd src && find . -name '*.js' -exec wc -c {} \;) | sort -n | tail -n $((RANKS+1)) | tac | tail -n +2 | sed -E 's/^\s+//g; s/\s+/\t/g' | column -t -s"	"
)" )

declare -a LONGLINES=( "$(
	echo -e "Longest lines"
	(cd src && find . -name '*.js' -exec wc -L {} \;) | sort -n | tail -n $((RANKS+1)) | tac | tail -n +2 | sed -E 's/^\s+//g; s/\s+/\t/g' | column -t -s"	"
)" )

declare WIDTH=$(( $(stty size | cut -f2 -d\ ) - 2))

declare HEAD=1
paste -d"	" <(printf -- "%s\n" "${RANKLIST[@]}") <(printf -- "%s\n" "${LOC[@]}") <(printf -- "%s\n" "${CHARS[@]}") <(printf -- "%s\n" "${LONGLINES[@]}") | column -t -s"	" -o' | ' -c$WIDTH | \
while read LINE; do
	if (( HEAD )); then
		echo -n "+"; printf -- '-%.0s' $(seq 1 $WIDTH); echo "+"
		echo -ne "| "
		echo -ne "\e[1m"
		echo -n "$LINE"
		echo -ne "\e[0m"
		echo -e "\r\e[$((WIDTH + 1))C|"
		echo -n "+"; printf -- '-%.0s' $(seq 1 $WIDTH); echo "+"
	else
		echo -n "| $LINE"
		echo -e "\r\e[$((WIDTH))C |"
	fi
	HEAD=0
done
echo -ne "+"
printf -- '-%.0s' $(seq 1 $WIDTH)
echo -ne "+"

echo ""
echo ""

###
echo -e "\n\e[1mGit graph\e[0m\n"

git log --graph --all --oneline --decorate --full-history --color --pretty=format:"%x1b[31m%h%x09%x1b[32m%d%x1b[0m%x20%s"

echo ""
echo ""
