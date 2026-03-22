idf_component_register(
    SRCS 
        "iot_button.c"
        "button_gpio.c"
        "button_adc.c"
        "button_matrix.c"
    INCLUDE_DIRS 
        "include"
        "interface"
    REQUIRES 
        driver
        esp_timer
        esp_adc
)

# Define version macros
target_compile_definitions(${COMPONENT_LIB} PRIVATE
    BUTTON_VER_MAJOR=3
    BUTTON_VER_MINOR=3
    BUTTON_VER_PATCH=1
)
