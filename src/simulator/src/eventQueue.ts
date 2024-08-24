/**
 * Event Queue is simply a heap Queue, basic implementation O(logn).
 * @category eventQueue
 */

interface QueueObject {
    queueProperties: {
        inQueue: boolean
        time: number
        index: number
    }
    propagationDelay: number
}

export default class EventQueue {
    size: number
    queue: Array<QueueObject>
    backIndex: number
    time: number
    constructor(size: number) {
        this.size = size;
        this.queue = new Array(size);
        this.backIndex = 0;
        this.time = 0;
    }

    add(obj: QueueObject, delay: number) {
        if (obj.queueProperties.inQueue) {
            this.remove(obj); // Remove the existing element from the heap
        }

        if (this.backIndex === this.size) throw 'EventQueue size exceeded';
        obj.queueProperties.time = this.time + (delay || obj.propagationDelay);
        obj.queueProperties.index = this.backIndex;
        this.queue[this.backIndex] = obj;
        obj.queueProperties.inQueue = true;
        this.heapifyUp(this.backIndex); // Heapify the element up to its correct position
        this.backIndex++;
    }

    /**
    * To add without any delay.
    */
    addImmediate(obj: QueueObject) {
        this.add(obj, 0);
    }

    /**
    * Function to remove an object from the queue
    */
    remove(obj: QueueObject) {
        if (!obj.queueProperties.inQueue) return;
        const { index } = obj.queueProperties;
        this.swap(index, this.backIndex - 1);
        obj.queueProperties.inQueue = false;
        this.backIndex--;
        this.heapifyDown(index); // Heapify the swapped element down to its correct position
    }

    /**
    * Function to swap two objects in the queue
    */
    swap(v1: number, v2: number) {
        const obj1 = this.queue[v1];
        obj1.queueProperties.index = v2;

        const obj2 = this.queue[v2];
        obj2.queueProperties.index = v1;

        this.queue[v1] = obj2;
        this.queue[v2] = obj1;
    }

    /**
    * Function to heapify the element up to its correct position.
    */
    heapifyUp(startIndex: number) {
        let index = startIndex;
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.queue[index].queueProperties.time >= this.queue[parentIndex].queueProperties.time) break;
            this.swap(index, parentIndex);
            index = parentIndex;
        }
    }

    /**
    * Function to heapify the element down to its correct position.
    */
    heapifyDown(indexStart: number) {
        let index = indexStart;
        while (true) {
            const leftChildIndex = 2 * index + 1;
            const rightChildIndex = 2 * index + 2;
            let smallestChildIndex = index;

            if (leftChildIndex < this.backIndex && this.queue[leftChildIndex].queueProperties.time < this.queue[smallestChildIndex].queueProperties.time) {
                smallestChildIndex = leftChildIndex;
            }

            if (rightChildIndex < this.backIndex && this.queue[rightChildIndex].queueProperties.time < this.queue[smallestChildIndex].queueProperties.time) {
                smallestChildIndex = rightChildIndex;
            }

            if (smallestChildIndex === index) break;

            this.swap(index, smallestChildIndex);
            index = smallestChildIndex;
        }
    }

    /**
    * function to pop element from the front of the queue
    */
    pop() {
        if (this.isEmpty()) throw 'Queue Empty';

        const obj = this.queue[0];
        this.time = obj.queueProperties.time;
        this.remove(obj);
        return obj;
    }

    /**
     * function to reset the queue
     */
    reset() {
        while (this.backIndex > 0) {
            this.queue[this.backIndex - 1].queueProperties.inQueue = false;
            this.backIndex--;
        }
        this.time = 0;
    }

    /**
    * function to check if the queue is empty.
    */
    isEmpty() {
        return this.backIndex === 0;
    }
}