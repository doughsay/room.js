function announceTakeItem(sender, recipient, obj) {
        if (sender === recipient) {
            return 'Taken.';
        }
        return `${ sender.name } takes the ${ obj.name }.`;
    }