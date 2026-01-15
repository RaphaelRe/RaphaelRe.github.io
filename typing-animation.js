class TypingAnimationWelcome {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.text = '';
    this.isTyping = false;
    this.animationQueue = [];
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async typeText(text, speed = 100) {
    this.isTyping = true;
    this.text = '';
    
    for (let i = 0; i < text.length; i++) {
      this.text += text[i];
      this.updateDisplay();
      await this.sleep(speed);
    }
    
    this.isTyping = false;
  }

  async deleteText(speed = 50) {
    this.isTyping = true;
    
    while (this.text.length > 0) {
      this.text = this.text.slice(0, -1);
      this.updateDisplay();
      await this.sleep(speed);
    }
    
    this.isTyping = false;
  }

  updateDisplay() {
    this.container.innerHTML = this.text + '<span class="cursor"></span>';
  }

  updateDisplayFinal() {
    this.container.innerHTML = this.text + '<span class="cursor-final"></span>';
  }

  async startAnimation() {
    this.container.innerHTML = this.text + '<span class="cursor"></span>';
    await this.sleep(1500);
    await this.deleteText(100);
    await this.sleep(1000);

    await this.typeText('Welcome!', 150);
    await this.sleep(2000);
    await this.deleteText(100);
    await this.typeText('My name is Raphael', 150);
    
    // Keep the final text displayed
    this.updateDisplay();
    await this.sleep(100);
    this.updateDisplayFinal();
  }
}






class TypingAnimationFurther {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.text = '';
    this.isTyping = false;
    this.animationQueue = [];
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async typeText(text, speed = 100) {
    this.isTyping = true;
    this.text = '';
    
    for (let i = 0; i < text.length; i++) {
      this.text += text[i];
      this.updateDisplay();
      await this.sleep(speed);
    }
    this.isTyping = false;
  }

  async deleteText(speed = 50) {
    this.isTyping = true;
    
    while (this.text.length > 0) {
      this.text = this.text.slice(0, -1);
      this.updateDisplay();
      await this.sleep(speed);
    }
    
    this.isTyping = false;
  }

  updateDisplay() {
    this.container.innerHTML = this.text + '<span class="cursor"></span>';
  }

  async startAnimation() {
    await this.sleep(10000);
    this.container.innerHTML = this.text + '<span class="cursor"></span>';
    await this.sleep(500);

    await this.typeText('I am a postdoc at TUM.', 150);
    
    // Keep the final text displayed
    this.updateDisplay();
  }
}






// Initialize the typing animation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const typingAnimation = new TypingAnimationWelcome('typing-animation');
  typingAnimation.startAnimation();
});

document.addEventListener('DOMContentLoaded', () => {
  const typingAnimation = new TypingAnimationFurther('typing-animation2');
  typingAnimation.startAnimation();
});
