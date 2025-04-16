let isValidEnter = false;
let keyAlreadyDown = false;

/*
    This Method prepares the saveProperty function.
    It has a QoL function where you can 'abort' a save through holding the Enter key longer than 500ms.
*/
export function keyDown(event: KeyboardEvent): void {
    if (event.key == 'Enter' && !keyAlreadyDown) {
        keyAlreadyDown = true;
        isValidEnter = true;
        setTimeout(() => {
            isValidEnter = false;
        }, 500);
    }
}

/*
    This Method executes the saveProperty function.
    It only executes when the 'Enter' key is lifted within 500ms since pressing it.
*/
export function keyUp(event: KeyboardEvent, action: CallableFunction): void {
    keyAlreadyDown = false;
    if (event.key == 'Enter' && isValidEnter) {
        action();
    }
}
