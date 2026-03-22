#ifndef BOARD_PINS_H
#define BOARD_PINS_H

/**
 * ESP32-S3-BOX Pin Configuration
 * 
 * Hardware:
 * - Micrófono: ES7210 (4-channel ADC via I2S)
 * - Altavoz: ES8311 (Audio Codec via I2S)
 * - Pantalla: ILI9342C (320x240 LCD)
 */

// ============ I2S MICROPHONE (ES7210) ============
// IMPORTANTE: ES7210 usa I2S estándar (no PDM)
#define I2S_MIC_SERIAL_CLOCK        GPIO_NUM_47  // BCLK (Bit Clock)
#define I2S_MIC_LEFT_RIGHT_CLOCK    GPIO_NUM_48  // LRCK/WS (Word Select)
#define I2S_MIC_SERIAL_DATA         GPIO_NUM_21  // DOUT (Data Out)

// ============ I2S SPEAKER (ES8311) ============
#define I2S_SPK_SERIAL_CLOCK        GPIO_NUM_17  // BCLK
#define I2S_SPK_LEFT_RIGHT_CLOCK    GPIO_NUM_47  // LRCK/WS
#define I2S_SPK_SERIAL_DATA         GPIO_NUM_15  // DIN (Data In)

// ============ I2C (Shared: ES7210 + ES8311 + Touch) ============
#define I2C_SCL                     GPIO_NUM_18
#define I2C_SDA                     GPIO_NUM_8

// I2C Addresses
#define ES7210_ADDR                 0x40  // Micrófono ADC
#define ES8311_ADDR                 0x18  // Codec de audio

// ============ POWER CONTROL ============
#define POWER_ON_PIN                GPIO_NUM_46  // PA_CTRL (Amplificador)
#define MUTE_PIN                    GPIO_NUM_1   // MUTE_CTRL

// ============ LCD DISPLAY ============
#define LCD_CS                      GPIO_NUM_5
#define LCD_DC                      GPIO_NUM_4
#define LCD_RST                     GPIO_NUM_48
#define LCD_BACKLIGHT               GPIO_NUM_45
#define LCD_SPI_CLK                 GPIO_NUM_7
#define LCD_SPI_MOSI                GPIO_NUM_6

// ============ BUTTONS ============
#define BUTTON_1                    GPIO_NUM_1   // Boot button

// ============ LED ============
#define LED_PIN                     GPIO_NUM_39  // RGB LED data pin

// ============ AUDIO SETTINGS ============
#define AUDIO_SAMPLE_RATE           16000  // 16kHz para voz (compatible con Wyoming)
#define AUDIO_BITS_PER_SAMPLE       16     // 16-bit depth
#define AUDIO_CHANNELS_MIC          1      // Mono para ASR
#define AUDIO_CHANNELS_SPK          2      // Stereo para reproducción

#endif // BOARD_PINS_H
