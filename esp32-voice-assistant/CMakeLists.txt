cmake_minimum_required(VERSION 3.16)

# Incluir componentes del BSP esp-box y componentes adicionales
set(EXTRA_COMPONENT_DIRS 
    "${CMAKE_SOURCE_DIR}/components"
    "${CMAKE_SOURCE_DIR}/components/lcd_touch/esp_lcd_touch"
    "${CMAKE_SOURCE_DIR}/components/lcd_touch/esp_lcd_touch_tt21100"
    "${CMAKE_SOURCE_DIR}/components/lcd_touch/esp_lcd_touch_gt911"
    "${CMAKE_SOURCE_DIR}/components/lcd/esp_lcd_ili9341"
)

include($ENV{IDF_PATH}/tools/cmake/project.cmake)

project(esp32s3_box_voice_ui)
